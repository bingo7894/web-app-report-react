import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import ManageReportDialog from "./ManageReportDialog";
import { CHECKLIST_SECTIONS } from "../utils/config";
import { isValidEmail, isValidPhone } from "../utils/inputValidation";

const signatureActionButtonClass =
  "rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700";

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100";

const openNativePicker = (event) => {
  if (typeof event.currentTarget.showPicker === "function") {
    event.currentTarget.showPicker();
  }
};

const SignaturePad = forwardRef(
  (
    { label, date, onDateChange, variant = "form1", scrollId, errorMessage },
    ref,
  ) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const hasDrawnRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getSignatureData: () => {
        return canvasRef.current
          ? canvasRef.current.toDataURL("image/png")
          : null;
      },
      isEmpty: () => !hasDrawnRef.current,
      clearSignature,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 160;

        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    const startDrawing = (event) => {
      hasDrawnRef.current = true;
      setIsDrawing(true);
      draw(event);
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.getContext("2d").beginPath();
    };

    const draw = (event) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    function clearSignature() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawnRef.current = false;
    }

    if (variant === "form2") {
      return (
        <div className="text-center" data-scroll-id={scrollId}>
          <div className="overflow-hidden rounded-xl bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="h-40 w-full touch-none bg-white"
            />
          </div>
          <p className="mt-3 text-[15px] text-slate-500">{label}</p>
        </div>
      );
    }

    return (
      <div
        className="signature-box"
        style={styles.signatureBox}
        data-scroll-id={scrollId}
      >
        <label style={styles.sigLabel}>{label}</label>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={styles.canvas}
        />
        <div className="sig-controls" style={styles.sigControls}>
          <input
            type="date"
            name={
              scrollId === "signature-inspector"
                ? "signature-date-inspector"
                : "signature-date-owner"
            }
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            onClick={openNativePicker}
            onFocus={openNativePicker}
            style={{
              ...styles.dateInput,
              ...(errorMessage ? styles.dateInputError : null),
            }}
          />
          {errorMessage ? (
            <p style={styles.dateErrorText}>{errorMessage}</p>
          ) : null}
          <button
            type="button"
            onClick={clearSignature}
            style={styles.btnClear}
          >
            <i className="fas fa-eraser"></i> ลบลายเซ็น
          </button>
        </div>
      </div>
    );
  },
);

SignaturePad.displayName = "SignaturePad";

function ValidationDialog({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 text-primary">
          <i className="fas fa-circle-exclamation text-xl"></i>
          <h4 className="text-lg font-bold">กรุณากรอกข้อมูลให้ครบ</h4>
        </div>
        <p className="text-[15px] leading-7 text-slate-700">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-blue-800"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportFooter({
  formData = {},
  handleChange,
  variant = "form1",
  authToken = "",
  onUnauthorized,
  validationErrors = {},
  setValidationErrors,
}) {
  const [remark, setRemark] = useState("");
  const [inspectorDate, setInspectorDate] = useState("");
  const [ownerDate, setOwnerDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationDialog, setValidationDialog] = useState(null);
  const [signatures, setSignatures] = useState({
    inspector: null,
    owner: null,
  });

  const inspectorSigRef = useRef();
  const ownerSigRef = useRef();

  const focusField = (target) => {
    if (!target) return;

    const element = document.querySelector(`[name="${target}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        if (typeof element.focus === "function") {
          element.focus();
        }
      }, 250);
      return;
    }

    const fallback = document.querySelector(`[data-scroll-id="${target}"]`);
    if (fallback) {
      fallback.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const openValidationDialog = (message, target) => {
    setValidationDialog({ message, target });
    focusField(target);
  };

  const clearValidationError = (field) => {
    setValidationErrors?.((prev) => {
      if (!prev?.[field]) return prev;

      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const setFieldError = (errors, field, message) => {
    if (!errors[field]) {
      errors[field] = message;
    }
  };

  const getRemarkPrefix = (item) => `หัวข้อ ${item.no} ${item.label} พบปัญหา :`;

  const isRemarkIncomplete = (item) => {
    const value = String(formData[`remark_${item.name}`] || "").trim();
    const prefix = getRemarkPrefix(item);
    return !value || value === prefix || value === `${prefix} `;
  };

  const validateGeneralFields = (errors) => {
    const commonFields = [
      ["reportDate", "กรุณาระบุวันที่"],
      ["projectName", "กรุณาระบุชื่อโครงการ"],
      ["address", "กรุณาระบุที่ตั้ง"],
      ["contactName", "กรุณาระบุชื่อผู้ติดต่อ"],
      ["phone", "กรุณาระบุเบอร์โทร 10 หลัก"],
      ["email", "กรุณาระบุ Email"],
      ["lineId", "กรุณาระบุ ID Line"],
    ];

    for (const [field, message] of commonFields) {
      if (!String(formData[field] || "").trim()) {
        setFieldError(errors, field, message);
      }
    }

    if (!isValidPhone(formData.phone)) {
      setFieldError(errors, "phone", "กรุณาระบุเบอร์โทรเป็นตัวเลข 10 หลัก");
    }

    if (!isValidEmail(formData.email)) {
      setFieldError(errors, "email", "กรุณาระบุ Email ให้ถูกต้องตามรูปแบบ");
    }

    if (variant === "form2") {
      const form2Fields = [
        ["operatedBy", "กรุณาระบุผู้ปฏิบัติงาน"],
        ["jobType2", "กรุณาเลือกประเภทงาน"],
        ["serviceRendered", "กรุณาระบุรายการงานที่ดำเนินการ"],
        ["overallStatus", "กรุณาเลือกสถานะโดยรวม"],
        ["endTime", "กรุณาระบุเวลาสิ้นสุดงาน"],
      ];

      for (const [field, message] of form2Fields) {
        if (!String(formData[field] || "").trim()) {
          setFieldError(errors, field, message);
        }
      }

      if (
        formData.jobType2 === "other" &&
        !String(formData.jobTypeOther || "").trim()
      ) {
        setFieldError(errors, "jobTypeOther", "กรุณาระบุรายละเอียดประเภทงาน");
      }

      if (
        formData.overallStatus === "ใช้ไม่ได้" &&
        !String(formData.overallStatusAction || "").trim()
      ) {
        setFieldError(
          errors,
          "overallStatusAction",
          "กรุณาเลือกแนวทางดำเนินการเมื่อสถานะใช้ไม่ได้",
        );
      }

      if (
        formData.overallStatus === "ใช้ไม่ได้" &&
        formData.overallStatusAction === "other" &&
        !String(formData.overallStatusOther || "").trim()
      ) {
        setFieldError(
          errors,
          "overallStatusOther",
          "กรุณาระบุรายละเอียดเพิ่มเติมของสถานะใช้ไม่ได้",
        );
      }
    }
  };

  const validateCurrentForm = () => {
    const errors = {};
    validateGeneralFields(errors);

    if (variant === "form1") {
      if (!String(formData.inspectionType || "").trim()) {
        setFieldError(errors, "inspectionType", "กรุณาเลือกประเภทการตรวจสอบ");
      }

      for (const section of CHECKLIST_SECTIONS) {
        for (const item of section.items) {
          if (!String(formData[item.name] || "").trim()) {
            setFieldError(
              errors,
              item.name,
              `กรุณาประเมินหัวข้อ ${item.no} ${item.label}`,
            );
          }

          if (formData[item.name] === "ใช้ไม่ได้" && isRemarkIncomplete(item)) {
            setFieldError(
              errors,
              `remark_${item.name}`,
              `กรุณาระบุรายละเอียดปัญหาของหัวข้อ ${item.no}`,
            );
          }
        }
      }

      if (!String(remark || "").trim()) {
        setFieldError(errors, "remarkTemplate", "กรุณาเลือก GENERAL REMARKS");
      }

      if (inspectorSigRef.current?.isEmpty()) {
        setFieldError(
          errors,
          "signature-inspector",
          "กรุณาลงลายเซ็นผู้ตรวจสอบอาคาร",
        );
      }

      if (!String(inspectorDate || "").trim()) {
        setFieldError(
          errors,
          "signature-date-inspector",
          "กรุณาระบุวันที่ของผู้ตรวจสอบอาคาร",
        );
      }

      if (ownerSigRef.current?.isEmpty()) {
        setFieldError(
          errors,
          "signature-owner",
          "กรุณาลงลายเซ็นเจ้าของอาคาร / ผู้ดูแลอาคาร",
        );
      }

      if (!String(ownerDate || "").trim()) {
        setFieldError(
          errors,
          "signature-date-owner",
          "กรุณาระบุวันที่ของเจ้าของอาคาร / ผู้ดูแลอาคาร",
        );
      }
    } else {
      if (
        String(formData.overallStatus || "").trim() === "ใช้ไม่ได้" &&
        !String(formData.problemDetail || "").trim()
      ) {
        setFieldError(errors, "problemDetail", "กรุณาระบุรายละเอียดปัญหาที่พบ");
      }

      if (inspectorSigRef.current?.isEmpty()) {
        setFieldError(
          errors,
          "signature-inspector",
          "กรุณาลงลายเซ็นผู้ตรวจสอบอาคาร",
        );
      }

      if (ownerSigRef.current?.isEmpty()) {
        setFieldError(
          errors,
          "signature-owner",
          "กรุณาลงลายเซ็นเจ้าของอาคาร / ผู้ดูแลอาคาร",
        );
      }
    }

    setValidationErrors?.(errors);

    const firstErrorEntry = Object.entries(errors)[0];
    if (!firstErrorEntry) {
      return null;
    }

    const [target, message] = firstErrorEntry;
    return { target, message };
  };

  const handleOpenDialog = () => {
    const error = validateCurrentForm();
    if (error) {
      openValidationDialog(error.message, error.target);
      return;
    }

    const inspectorSig = inspectorSigRef.current?.getSignatureData();
    const ownerSig = ownerSigRef.current?.getSignatureData();
    setSignatures({
      inspector: inspectorSig,
      owner: ownerSig,
    });
    setIsDialogOpen(true);
  };

  const handleRadioChange = (event) => {
    setRemark(event.target.value);
    clearValidationError("remarkTemplate");
  };

  const footerDialog = validationDialog ? (
    <ValidationDialog
      message={validationDialog.message}
      onClose={() => setValidationDialog(null)}
    />
  ) : null;

  if (variant === "form2") {
    return (
      <div className="report-footer-container space-y-6">
        <div className="rounded-2xl border border-slate-300 bg-white px-5 py-6 shadow-sm md:px-6">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 text-primary">
            <i className="fas fa-signature"></i>
            <h3 className="text-[18px] font-bold">ลายเซ็น (Signatures)</h3>
          </div>

          <div className="mx-auto mb-5 max-w-xs text-center">
            <label className="mb-2 block text-[15px] font-semibold text-slate-900">
              เวลาสิ้นสุดงาน (End of Service - Date & Time)
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime || ""}
              onChange={handleChange}
              onClick={openNativePicker}
              onFocus={openNativePicker}
              className={`${inputClassName} cursor-pointer ${
                validationErrors.endTime
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : ""
              }`}
            />
            {validationErrors.endTime && (
              <p className="mt-2 text-sm text-red-600">
                {validationErrors.endTime}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
            <div className="text-center">
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                <div className="p-4">
                  <SignaturePad
                    ref={inspectorSigRef}
                    label="ผู้ตรวจสอบอาคาร (Inspector)"
                    variant="form2"
                    scrollId="signature-inspector"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => inspectorSigRef.current?.clearSignature?.()}
                className={`${signatureActionButtonClass} mt-3`}
              >
                <i className="fas fa-eraser"></i> ลบลายเซ็น
              </button>
            </div>
            <div className="text-center">
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                <div className="p-4">
                  <SignaturePad
                    ref={ownerSigRef}
                    label="เจ้าของอาคาร / ผู้ดูแลอาคาร"
                    variant="form2"
                    scrollId="signature-owner"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => ownerSigRef.current?.clearSignature?.()}
                className={`${signatureActionButtonClass} mt-3`}
              >
                <i className="fas fa-eraser"></i> ลบลายเซ็น
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleOpenDialog}
            className="inline-flex min-w-[280px] items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            <i className="fas fa-clipboard-check"></i>
            ตรวจสอบและจัดการรายงาน (Review & Manage)
          </button>
        </div>

        {footerDialog}

        <ManageReportDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          formData={{
            ...formData,
            generalRemark: remark,
          }}
          signatures={signatures}
          authToken={authToken}
          onUnauthorized={onUnauthorized}
        />
      </div>
    );
  }

  return (
    <div className="report-footer-container space-y-6">
      <div className="rounded-2xl border border-slate-300 bg-white px-5 py-6 shadow-sm md:px-6">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 text-primary">
          <i className="fas fa-comment-alt"></i>
          <h3 className="text-[18px] font-bold">GENERAL REMARKS</h3>
        </div>

        <div
          className={`space-y-4 rounded-xl p-3 ${
            validationErrors.remarkTemplate
              ? "border border-red-300 bg-red-50"
              : ""
          }`}
          data-scroll-id="remarkTemplate"
        >
          <label className="flex items-start gap-2 text-[15px] text-slate-900">
            <input
              type="radio"
              name="remarkTemplate"
              value="พบปัญหาทั่วไปสามารถวางแผนกำหนดการแก้ไขได้ โดยจะส่งตามข้อมูลของโครงการภายหลัง"
              onChange={handleRadioChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span>
              พบปัญหาทั่วไปสามารถวางแผนกำหนดการแก้ไขได้
              โดยจะส่งตามข้อมูลของโครงการภายหลัง
            </span>
          </label>
          <label className="flex items-start gap-2 text-[15px] text-slate-900">
            <input
              type="radio"
              name="remarkTemplate"
              value="ไม่พบปัญหา ณ วันที่ทำการตรวจสอบอาคาร"
              onChange={handleRadioChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span>ไม่พบปัญหา ณ วันที่ทำการตรวจสอบอาคาร</span>
          </label>
        </div>
        {validationErrors.remarkTemplate && (
          <p className="mt-2 text-sm text-red-600">
            {validationErrors.remarkTemplate}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-300 bg-white px-5 py-6 shadow-sm md:px-6">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 text-primary">
          <i className="fas fa-signature"></i>
          <h3 className="text-[18px] font-bold">ลายเซ็น (Signatures)</h3>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SignaturePad
            ref={inspectorSigRef}
            label="ผู้ตรวจสอบอาคาร (Inspector)"
            date={inspectorDate}
            onDateChange={(value) => {
              setInspectorDate(value);
              clearValidationError("signature-date-inspector");
            }}
            scrollId="signature-inspector"
            errorMessage={validationErrors["signature-date-inspector"]}
          />
          <SignaturePad
            ref={ownerSigRef}
            label="เจ้าของอาคาร / ผู้ดูแลอาคาร"
            date={ownerDate}
            onDateChange={(value) => {
              setOwnerDate(value);
              clearValidationError("signature-date-owner");
            }}
            scrollId="signature-owner"
            errorMessage={validationErrors["signature-date-owner"]}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleOpenDialog}
          className="inline-flex min-w-[320px] items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-blue-800"
        >
          <i className="fas fa-clipboard-check"></i>
          ตรวจสอบและจัดการรายงาน (Review & Manage)
        </button>
      </div>

      {footerDialog}

      <ManageReportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        formData={{
          ...formData,
          generalRemark: remark,
        }}
        signatures={signatures}
        authToken={authToken}
        onUnauthorized={onUnauthorized}
      />
    </div>
  );
}

const styles = {
  signatureBox: {
    border: "1px solid #cbd5e1",
    padding: "16px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textAlign: "center",
  },
  sigLabel: {
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    fontSize: "15px",
  },
  canvas: {
    background: "#fff",
    border: "2px dashed #cbd5e1",
    borderRadius: "14px",
    width: "100%",
    cursor: "crosshair",
    touchAction: "none",
  },
  sigControls: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  dateInput: {
    width: "180px",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    textAlign: "center",
    cursor: "pointer",
  },
  dateInputError: {
    border: "1px solid #f87171",
    boxShadow: "0 0 0 3px rgba(254, 226, 226, 0.9)",
  },
  dateErrorText: {
    margin: "2px 0 0",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: 500,
  },
  btnClear: {
    background: "#64748b",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
