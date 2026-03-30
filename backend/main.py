from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, json, datetime, os, sys, asyncio, tempfile
from dotenv import load_dotenv
from playwright.async_api import async_playwright
import smtplib
from email.message import EmailMessage

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

load_dotenv()

app = FastAPI(title="Service Report API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 1. PDF Generation (Playwright) ──────────────────────────────────────────

async def generate_pdf(html_content: str, filename: str) -> str:
    reports_dir = tempfile.gettempdir()
    pdf_path = os.path.join(reports_dir, filename)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            await page.set_content(html_content, wait_until="domcontentloaded", timeout=20000)
        except Exception as e:
            print(f"--> [Warning] set_content timeout/error: {e}")
        
        try:
            await asyncio.wait_for(page.evaluate("document.fonts.ready"), timeout=10)
        except:
            print("--> [Warning] Fonts did not load in time, proceeding anyway.")
        
        await page.pdf(path=pdf_path, format="A4", print_background=True)
        await browser.close()
        
    print(f"--> [PDF Generated] {pdf_path}")
    return pdf_path

# ─── 2. Email Service ────────────────────────────────────────────────────────

def send_email_with_pdf(data: dict, pdf_path: str):
    info = data.get("generalInfo", {})
    project = info.get("projectName", "—")

    # ── รับ recipients array จาก frontend ──────────────────────────
    # frontend ใหม่ส่ง recipients: ["a@mail.com", "b@mail.com"]
    # ถ้าไม่มี (เรียกจาก legacy) ให้ fallback ไปที่ generalInfo.email
    recipients: list = data.get("recipients", [])
    if not recipients:
        fallback = info.get("email", "").strip()
        recipients = [fallback] if fallback else []

    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    if not recipients or not smtp_user or not smtp_pass:
        msg = f"Skipped sending (recipients={recipients}, missing SMTP config in .env)"
        print(f"--> [EMAIL] {msg}")
        return False, msg

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 465))

    # ── อ่าน PDF ครั้งเดียว ใช้แนบทุก email ──────────────────────────
    pdf_data = None
    pdf_filename = None
    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            pdf_data = f.read()
        pdf_filename = os.path.basename(pdf_path)

    results = []

    try:
        # เปิด connection ครั้งเดียว ส่งทุกคน
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
            server.login(smtp_user, smtp_pass)

            for recipient in recipients:
                try:
                    msg = EmailMessage()
                    msg["Subject"] = f"เอกสารรายงานการปฏิบัติงานเบื้องต้น — โครงการ {project}"
                    msg["From"] = smtp_user
                    msg["To"] = recipient
                    msg.set_content(f"""เรียนเจ้าของอาคารหรือผู้ดูแลอาคาร

ขอนำส่งรายงานการปฎิบัติงานเบื้องต้นสำหรับโครงการ {project}
คุณสามารถดาวน์โหลดหรือดูรายละเอียดได้ในไฟล์ PDF ที่แนบมานี้ครับ

ขอแสดงความนับถือ,
ระบบ Service Report อัตโนมัติ""")

                    if pdf_data:
                        msg.add_attachment(
                            pdf_data,
                            maintype="application",
                            subtype="pdf",
                            filename=pdf_filename,
                        )

                    server.send_message(msg)
                    print(f"--> [EMAIL] Sent successfully to {recipient}")
                    results.append({"to": recipient, "ok": True})

                except Exception as e:
                    print(f"--> [EMAIL] Failed to send to {recipient}: {e}")
                    results.append({"to": recipient, "ok": False, "error": str(e)})

    except Exception as e:
        err_msg = str(e)
        print(f"--> [EMAIL] SMTP connection error: {err_msg}")
        return False, f"SMTP connection error: {err_msg}"

    failed = [r for r in results if not r["ok"]]
    if not failed:
        return True, f"Email sent successfully to {len(results)} recipient(s)"
    elif len(failed) < len(results):
        return True, f"Partial success: {len(results) - len(failed)}/{len(results)} sent. Failed: {[r['to'] for r in failed]}"
    else:
        return False, f"All emails failed: {[r['error'] for r in failed]}"

# ─── 3. Google Sheet & Calendar ──────────────────────────────────────────────

import urllib.request

def save_to_google_sheet(data: dict) -> (bool, str):
    webhook_url = os.getenv("GOOGLE_SHEET_WEBHOOK_URL", "").strip()
    if not webhook_url:
        msg = "GOOGLE_SHEET_WEBHOOK_URL is missing in .env. Skipping Google Sheet save."
        print(f"--> [SHEET] {msg}")
        return False, msg
        
    info = data.get("generalInfo", {})
    
    report_datetime = info.get("reportDate", "")
    date_part = "-"
    time_part = "-"
    if "T" in report_datetime:
        parts = report_datetime.split("T")
        date_part = parts[0]
        time_part = parts[1]
    elif report_datetime:
        date_part = report_datetime
    
    overall_status = "-"
    if "overallStatus" in data and isinstance(data["overallStatus"], dict):
        overall_status = data["overallStatus"].get("status", "-")
    elif "overallStatus" in data:
        overall_status = str(data["overallStatus"])
        
    current_year = datetime.datetime.now().year
    next_year = current_year + 1
    project_name = info.get("projectName", "-")

    try:
        if report_datetime and "T" in report_datetime:
            report_dt = datetime.datetime.fromisoformat(report_datetime.replace("Z", ""))
        else:
            report_dt = datetime.datetime.now()
            
        next_due_dt = report_dt + datetime.timedelta(days=365)
        next_year_alert = next_due_dt.strftime('%d/%m/%Y')
        next_due_date = next_due_dt.strftime('%Y-%m-%d')
    except:
        next_year_alert = f"{datetime.datetime.now().strftime('%d/%m')}/{next_year}"
        next_due_date = f"{next_year}-{datetime.datetime.now().strftime('%m-%d')}"

    job_type = data.get("inspectionType") if data.get("inspectionType") else data.get("jobType", "-")
        
    print("\n--- [DEBUG] ข้อมูลต้นทาง (data.get('generalInfo')) ---")
    print(json.dumps(info, indent=2, ensure_ascii=False))

    # ── ใช้ email แรกใน recipients สำหรับบันทึกลง Sheet ───────────────
    recipients = data.get("recipients", [])
    sheet_email = ",\n".join(recipients) if recipients else info.get("email", "-")
    
    payload = {
        "date": date_part,
        "time": time_part,
        "projectName": project_name,
        "address": info.get("address", "-"),
        "contactName": info.get("contactName", "-"),
        "phone": f"'{info.get('phone', '-')}",
        "email": sheet_email,
        "lineId": info.get("lineId", "-"),
        "jobType": job_type,
        "operatedBy": info.get("operatedBy", "-"),
        "overallStatus": overall_status,
        "nextYearAlert": next_year_alert,
        "nextDueDate": next_due_date
    }
    
    print("\n--- [DEBUG] ตลอดจับคู่ข้อมูลลง Google Sheet (A ถึง L) ---")
    for i, (k, v) in enumerate(payload.items()):
        if k != "nextDueDate":
            print(f"คอลัมน์ {chr(65+i)} ({k}): {v}")
    print("------------------------------------------\n")
    
    try:
        req = urllib.request.Request(webhook_url, method="POST")
        req.add_header('Content-Type', 'application/json')
        jsondata = json.dumps(payload).encode('utf-8')
        
        with urllib.request.urlopen(req, data=jsondata, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            if res_json.get("status") == "success":
                print("--> [SHEET] Successfully saved data to Google Sheets.")
                return True, "Success"
            else:
                msg = f"Apps Script error: {res_json.get('message', 'Unknown error')}"
                print(f"--> [SHEET] {msg}")
                return False, msg
    except Exception as e:
        err_msg = str(e)
        print(f"--> [SHEET] Failed to send: {err_msg}")
        return False, f"Network/DNS error: {err_msg}"

# ─── Endpoint ────────────────────────────────────────────────────────────────

@app.post("/api/submit-report")
async def submit_report(request: Request):
    try:
        data = await request.json()
        form_type = data.get("formType", "Form")
        html_content = data.get("htmlContent")
        
        print(f"\n=== Report Received: {form_type} ===")
        recipients = data.get("recipients", [])
        print(f"--> Recipients: {recipients}")
        
        # ── Setup File Name ──
        info = data.get("generalInfo", {})
        report_datetime = info.get("reportDate", "")
        date_part = report_datetime.split("T")[0] if "T" in report_datetime else (report_datetime or datetime.datetime.now().strftime('%Y-%m-%d'))
        
        job_type = data.get("inspectionType") if data.get("inspectionType") else data.get("jobType", form_type)
        project_name = info.get("projectName", "Untitled")

        safe_job_type = str(job_type).replace("/", "-").replace("\\", "-").strip()
        safe_project_name = str(project_name).replace("/", "-").replace("\\", "-").strip()
        safe_date = str(date_part).replace("/", "-")
        
        pdf_path = None
        if html_content:
            filename = f"Report_{safe_job_type}_{safe_project_name}_{safe_date}.pdf".replace(" ", "_")
            print(f"--> Generating PDF via Playwright as: {filename}")
            pdf_path = await generate_pdf(html_content, filename)
            
        print(f"--> Sending Email to {len(recipients)} recipient(s)...")
        email_ok, email_msg = send_email_with_pdf(data, pdf_path)
        
        # 🧹 ลบไฟล์ PDF ทิ้งหลังส่งเสร็จ
        if pdf_path and os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
                print("--> [CLEANUP] Deleted temporary PDF file.")
            except Exception as e:
                print(f"--> [Warning] Could not delete temp PDF: {e}")
        
        print("--> Saving to Google Sheets...")
        sheet_ok, sheet_msg = save_to_google_sheet(data)
        
        errors = []
        if not email_ok:
            errors.append(email_msg)
        if not sheet_ok:
            errors.append(sheet_msg)
            
        msg = "Report processed."
        if errors:
            msg += " Some tasks failed (Email/Sheet)."
            
        return {
            "status": "success",
            "message": msg,
            "pdf_saved": os.path.basename(pdf_path) if pdf_path else None,
            "details": {
                "email": {"ok": email_ok, "msg": email_msg},
                "sheet": {"ok": sheet_ok, "msg": sheet_msg},
            },
            "errors": errors,
        }
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)