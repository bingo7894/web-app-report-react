import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
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

  // Create print handler with proper ref setup
  // react-to-print v3.3.0 uses contentRef prop
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report-${formData.codeNo || "Report"}.pdf`,
    copyStyles: true,
  });

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

  const onPrintClick = () => {
    if (!printRef.current) {
      alert("รูปแบบการพิมพ์ยังไม่พร้อม กรุณารอสักครู่");
      return;
    }

    try {
      handlePrint();
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
      * { box-sizing: border-box; }
      body { margin: 0; background: #ffffff; }
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
        onUnauthorized?.();
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
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{ minHeight: "100vh" }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden transform transition-all max-h-[90vh] overflow-y-auto">
        {/* ส่วนหัว - Icon และ Title */}
        <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-8 text-center border-b border-blue-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
          >
            <i className="fas fa-times"></i>
          </button>
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <i className="fas fa-list-check text-3xl text-blue-600"></i>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            จัดการข้อมูลรายงาน
          </h2>
          <p className="text-slate-600 text-sm">
            ตรวจสอบความถูกต้องเรียบร้อยแล้ว! <br />
            คุณสามารถเลือกสั่งพิมพ์ PDF หรือส่งรายงานเข้าอีเมลได้
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">
            ผู้ใช้งานปัจจุบัน: {authUser?.email || "-"}
          </p>
        </div>

        {/* ส่วนเนื้อหา */}
        <div className="p-8 flex-grow">
          {/* Email Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <i className="fas fa-envelope text-blue-600 text-lg"></i>
              <label className="text-base font-semibold text-slate-800">
                ส่งรายงานเข้า Email (รวบถึงสร้าง PDF และส่งไฟล์ต่างกัน)
              </label>
            </div>

            {/* Email Input */}
            <div className="flex gap-3 mb-4">
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
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleAddEmail}
                disabled={!emailInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>

            {/* Email Chips */}
            {emailList.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {emailList.map((email, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-blue-300 text-sm text-slate-700"
                  >
                    <span>{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
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
              className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i className="fas fa-paper-plane"></i>
              {isSending ? "กำลังส่งรายงาน..." : "ส่งรายงาน"}
            </button>
          </div>
        </div>

        {/* ส่วนท้าย - Action Buttons */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex gap-3 justify-between flex-shrink-0">
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i> ย้อนกลับ
          </button>

          <div className="flex gap-3">
            <button
              onClick={onPrintClick}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium flex items-center gap-2"
            >
              <i className="fas fa-print"></i> พิมพ์รายงาน (PDF)
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
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
