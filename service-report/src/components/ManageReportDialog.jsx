import React, { useState, useRef, useEffect } from "react";
import ReportPrintTemplate from "./ReportPrintTemplate";
import { BACKEND_URL } from "../utils/config";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const splitEmailInput = (value) =>
  String(value || "")
    .replace(/["']/g, "")
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);

const translateBackendMessage = (message) => {
  if (!message) return "";

  return message
    .replace(
      /Email sent successfully to (\d+) recipient\(s\)/i,
      "ส่งอีเมลสำเร็จ $1 รายการ",
    )
    .replace(
      /Partial success: (\d+)\/(\d+) sent\. Failed: \[(.*)\]/i,
      "ส่งอีเมลสำเร็จบางส่วน $1 จาก $2 รายการ รายการที่ไม่สำเร็จ: $3",
    )
    .replace(/All emails failed: \[(.*)\]/i, "ส่งอีเมลไม่สำเร็จ: $1")
    .replace(/SMTP connection error:/i, "เชื่อมต่อระบบอีเมลไม่สำเร็จ:")
    .replace(/Skipped sending/i, "ข้ามการส่งอีเมล")
    .replace(/Success/i, "สำเร็จ")
    .replace(/Network\/DNS error:/i, "การเชื่อมต่อเครือข่ายมีปัญหา:")
    .replace(
      /GOOGLE_SHEET_WEBHOOK_URL is missing in \.env\. Skipping Google Sheet save\./i,
      "ยังไม่ได้ตั้งค่า GOOGLE_SHEET_WEBHOOK_URL ในไฟล์ .env จึงข้ามการบันทึก Google Sheet",
    );
};

export default function ManageReportDialog({
  isOpen,
  onClose,
  onResetForm,
  formData = {},
  signatures = {},
  authToken = "",
  authUser = null,
  onUnauthorized,
}) {
  const [emailList, setEmailList] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [printReady, setPrintReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    if (isOpen) {
      const initialEmails = String(formData.email || "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
      setEmailList((prev) => (prev.length > 0 ? prev : initialEmails));
      setSendResult(null);

      const timer = setTimeout(() => {
        setPrintReady(!!printRef.current);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, formData, signatures]);

  // ล็อคการเลื่อนของหน้าพื้นหลังเมื่อเปิด Modal (แก้ปัญหาเลื่อนฉากหลังบน iPhone)
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const onPrintClick = async () => {
    if (!printRef.current) {
      alert("รูปแบบการพิมพ์ยังไม่พร้อม กรุณารอสักครู่");
      return;
    }

    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("เบราว์เซอร์บล็อกหน้าพิมพ์ กรุณาอนุญาต popup ก่อน");
      }

      printWindow.document.open();
      printWindow.document.write(`<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preparing Report</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        color: #334155;
        background: #f8fafc;
      }
    </style>
  </head>
  <body>กำลังเตรียมเอกสาร...</body>
</html>`);
      printWindow.document.close();

      const printableHtml = await buildPrintableHtml();

      printWindow.document.open();
      printWindow.document.write(printableHtml);
      printWindow.document.close();

      window.setTimeout(() => {
        printWindow.focus();
        if (typeof printWindow.print === "function") {
          printWindow.print();
        }
      }, 350);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการพิมพ์: " + err.message);
    }
  };

  if (!isOpen) return null;

  const handleAddEmail = () => {
    const nextEmails = splitEmailInput(emailInput);
    if (nextEmails.length === 0) {
      return;
    }

    const invalidEmails = nextEmails.filter((email) => !emailPattern.test(email));
    if (invalidEmails.length > 0) {
      setSendResult({
        type: "error",
        message: `รูปแบบอีเมลไม่ถูกต้อง: ${invalidEmails.join(", ")}`,
      });
      return;
    }

    setEmailList((prev) => [...new Set([...prev, ...nextEmails])]);
    setSendResult(null);

    setEmailInput("");
  };

  const handleRemoveEmail = (email) => {
    setEmailList(emailList.filter((e) => e !== email));
  };

  const handleClearEmails = () => {
    setEmailList([]);
    setEmailInput("");
    setSendResult(null);
  };

  const toAbsoluteUrl = (value) => {
    try {
      return new URL(value, window.location.origin).href;
    } catch {
      return value;
    }
  };

  const fileToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const embedImagesAsDataUrl = async (rootNode) => {
    const images = Array.from(rootNode.querySelectorAll("img"));

    await Promise.all(
      images.map(async (img) => {
        const source = img.currentSrc || img.src;
        if (!source || source.startsWith("data:")) {
          return;
        }

        try {
          const response = await fetch(toAbsoluteUrl(source));
          const blob = await response.blob();
          img.src = await fileToDataUrl(blob);
        } catch (error) {
          console.warn("Unable to inline image for PDF:", source, error);
        }
      }),
    );
  };

  const buildPrintableHtml = async () => {
    if (!printRef.current) {
      throw new Error("รูปแบบรายงานยังไม่พร้อม");
    }

    await document.fonts.ready;

    const printableNode = printRef.current.cloneNode(true);
    await embedImagesAsDataUrl(printableNode);

    return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Service Report</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }

      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: 210mm;
        min-height: 297mm;
        background: #ffffff;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      img { max-width: 100%; }
    </style>
  </head>
  <body>${printableNode.outerHTML}</body>
</html>`;
  };

  const buildPayload = async () => {
    const recipients = emailList
      .map((email) => email.trim())
      .filter(Boolean);

    const generalInfo = {
      reportDate: formData.reportDate || "",
      codeNo: formData.codeNo || "",
      projectName: formData.projectName || "",
      address: formData.address || "",
      contactName: formData.contactName || "",
      phone: formData.phone || "",
      operatedBy: formData.operatedBy || "",
      email: formData.email || "",
      lineId: formData.lineId || "",
    };

    return {
      formType: formData.formType === "form2" ? "Form 1.2" : "Form 1.1",
      recipients,
      generalInfo,
      inspectionType: formData.inspectionType || "",
      jobType:
        formData.formType === "form2"
          ? formData.jobType2 === "other"
            ? formData.jobTypeOther || ""
            : formData.jobType2 || ""
          : "",
      overallStatus:
        formData.formType === "form2"
          ? { status: formData.overallStatus || "" }
          : { status: formData.generalRemark || "" },
      htmlContent: await buildPrintableHtml(),
    };
  };

  const handleSend = async () => {
    if (!authToken) {
      setSendResult({
        type: "error",
        message: "ยังไม่พบ session สำหรับส่งรายงาน กรุณาเข้าสู่ระบบใหม่",
      });
      return;
    }

    if (emailList.length === 0) {
      setSendResult({
        type: "error",
        message: "กรุณาเพิ่มอีเมลผู้รับอย่างน้อย 1 รายการ",
      });
      return;
    }

    const invalidEmail = emailList.find((email) => !emailPattern.test(email));
    if (invalidEmail) {
      setSendResult({
        type: "error",
        message: `อีเมลไม่ถูกต้อง: ${invalidEmail}`,
      });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/submit-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(await buildPayload()),
      });

      const result = await response.json();

      if (response.status === 401) {
        onUnauthorized?.("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        throw new Error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
      }

      if (!response.ok || result.status !== "success") {
        throw new Error(
          result.detail || result.message || "ไม่สามารถส่งรายงานได้",
        );
      }

      const detailMessages = [];
      if (result.details?.email?.msg) {
        detailMessages.push(
          `อีเมล: ${translateBackendMessage(result.details.email.msg)}`,
        );
      }
      if (result.details?.sheet?.msg) {
        detailMessages.push(
          `ชีต: ${translateBackendMessage(result.details.sheet.msg)}`,
        );
      }

      setSendResult({
        type: "success",
        message:
          detailMessages.join(" | ") || "ส่งรายงานไปยัง backend เรียบร้อยแล้ว",
      });
    } catch (error) {
      setSendResult({
        type: "error",
        message: error.message || "เกิดข้อผิดพลาดในการส่งรายงาน",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    onClose();
  };

  const handleReset = () => {
    onResetForm?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4"
      style={{ height: "100dvh" }} // ใช้ dvh เพื่อรองรับ Safe Area บน iPhone
    >
      <div 
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all sm:max-h-[90vh]"
        style={{
          WebkitOverflowScrolling: "touch", // เปิด Momentum Scrolling บน iOS
          overscrollBehavior: "contain"    // ป้องกัน Scroll ข้ามไปฉากหลัง
        }}
      >
        {/* ส่วนหัว - Icon และ Title */}
        <div className="relative flex-shrink-0 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-6 text-center sm:px-8 sm:py-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 sm:right-4 sm:top-4 sm:h-11 sm:w-11"
          >
            <i className="fas fa-times"></i>
          </button>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-blue-100 p-3 sm:p-4">
              <i className="fas fa-list-check text-2xl text-blue-600 sm:text-3xl"></i>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-800 sm:text-2xl">
            จัดการข้อมูลรายงาน
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            ตรวจสอบความถูกต้องเรียบร้อยแล้ว! <br />
            คุณสามารถเลือกสั่งพิมพ์ PDF หรือส่งรายงานเข้าอีเมลได้
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">
            ผู้ใช้งานปัจจุบัน: {authUser?.email || "-"}
          </p>
        </div>

        {/* ส่วนเนื้อหา */}
        <div className="flex-grow p-4 sm:p-8">
          {/* Email Section */}
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-6">
            <div className="mb-4 flex items-start gap-3 sm:items-center">
              <i className="fas fa-envelope text-blue-600 text-lg"></i>
              <label className="text-sm font-semibold leading-6 text-slate-800 sm:text-base">
                ส่งรายงานเข้า Email (รวบถึงสร้าง PDF และส่งไฟล์ต่างกัน)
              </label>
            </div>

            {/* Email Input */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                multiple
                placeholder="example1@email.com, example2@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
                onBlur={() => {
                  if (emailInput.includes(",") || emailInput.includes(";")) {
                    handleAddEmail();
                  }
                }}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleAddEmail}
                disabled={!emailInput.trim()}
                className="w-full rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>

            {/* Email Chips */}
            {emailList.length > 0 && (
              <div className="mb-4">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    รายชื่ออีเมลผู้รับ {emailList.length} รายการ
                  </p>
                  <button
                    type="button"
                    onClick={handleClearEmails}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 sm:w-auto"
                  >
                    <i className="fas fa-trash-can"></i>
                    เคลียร์อีเมล
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {emailList.map((email, index) => (
                    <div
                      key={index}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-300 bg-white px-3 py-1 text-sm text-slate-700"
                    >
                      <span className="max-w-[220px] truncate sm:max-w-none">{email}</span>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sendResult && (
              <div
                className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                  sendResult.type === "success"
                    ? "border border-green-200 bg-green-50 text-green-800"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {sendResult.message}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={
                emailList.length === 0 || isSending || !printReady || !authToken
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i className="fas fa-paper-plane"></i>
              {isSending ? "กำลังส่งรายงาน..." : "ส่งรายงาน"}
            </button>
          </div>
        </div>

        {/* ส่วนท้าย - Action Buttons */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            onClick={handleBack}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-2 font-medium text-white transition-colors hover:bg-orange-600 sm:w-auto"
          >
            <i className="fas fa-arrow-left"></i> ย้อนกลับ
          </button>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={onPrintClick}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-600 px-6 py-2 font-medium text-white transition-colors hover:bg-slate-700 sm:w-auto"
            >
              <i className="fas fa-print"></i> พิมพ์รายงาน (PDF)
            </button>
            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700 sm:w-auto"
            >
              <i className="fas fa-rotate-left"></i> ล้างฟอร์ม
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Template - Off-screen rendering */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "auto",
          visibility: "hidden",
        }}
      >
        <ReportPrintTemplate
          ref={printRef}
          formData={formData}
          signatures={signatures}
        />
      </div>
    </div>
  );
}
