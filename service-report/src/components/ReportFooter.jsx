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
    {
      label,
      scrollId,
      errorMessage,
      initialSignatureData = null,
      onSignatureChange,
    },
    ref,
  ) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const hasDrawnRef = useRef(false);
    const signatureDataUrlRef = useRef(null);
    const resizeFrameRef = useRef(null);

    const restoreSignature = (dataUrl) => {
      const canvas = canvasRef.current;
      if (!canvas || !dataUrl) return;

      const image = new Image();
      image.onload = () => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = dataUrl;
    };

    const saveSignatureSnapshot = () => {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawnRef.current) {
        return;
      }

      const nextSignature = canvas.toDataURL("image/png");
      signatureDataUrlRef.current = nextSignature;
      onSignatureChange?.(nextSignature);
    };

    const clearSignature = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawnRef.current = false;
      signatureDataUrlRef.current = null;
      onSignatureChange?.(null);
    };

    useImperativeHandle(ref, () => ({
      getSignatureData: () => {
        if (signatureDataUrlRef.current) {
          return signatureDataUrlRef.current;
        }

        return canvasRef.current ? canvasRef.current.toDataURL("image/png") : null;
      },
      isEmpty: () => !hasDrawnRef.current,
      clearSignature,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return undefined;

      const resizeCanvas = () => {
        const rect = container.getBoundingClientRect();
        const nextWidth = Math.round(rect.width);
        const nextHeight = 160;

        if (nextWidth <= 0) {
          return;
        }

        if (canvas.width === nextWidth && canvas.height === nextHeight) {
          return;
        }

        const previousSignature =
          hasDrawnRef.current && canvas.width > 0 && canvas.height > 0
            ? canvas.toDataURL("image/png")
            : signatureDataUrlRef.current;

        canvas.width = nextWidth;
        canvas.height = nextHeight;

        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (previousSignature) {
          signatureDataUrlRef.current = previousSignature;
          restoreSignature(previousSignature);
        }
      };

      const requestResize = () => {
        if (resizeFrameRef.current) {
          window.cancelAnimationFrame(resizeFrameRef.current);
        }

        resizeFrameRef.current = window.requestAnimationFrame(() => {
          resizeCanvas();
          resizeFrameRef.current = null;
        });
      };

      requestResize();

      const resizeObserver = new ResizeObserver(requestResize);
      resizeObserver.observe(container);

      window.addEventListener("orientationchange", requestResize);
      window.visualViewport?.addEventListener("resize", requestResize);

      return () => {
        if (resizeFrameRef.current) {
          window.cancelAnimationFrame(resizeFrameRef.current);
        }
        resizeObserver.disconnect();
        window.removeEventListener("orientationchange", requestResize);
        window.visualViewport?.removeEventListener("resize", requestResize);
      };
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!initialSignatureData) {
        if (signatureDataUrlRef.current) {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        signatureDataUrlRef.current = null;
        hasDrawnRef.current = false;
        return;
      }

      if (initialSignatureData === signatureDataUrlRef.current) {
        return;
      }

      signatureDataUrlRef.current = initialSignatureData;
      hasDrawnRef.current = true;
      restoreSignature(initialSignatureData);
    }, [initialSignatureData]);

    const getPoint = (event) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const startDrawing = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      canvasRef.current?.setPointerCapture?.(event.pointerId);
      hasDrawnRef.current = true;
      isDrawingRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const point = getPoint(event);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    };

    const stopDrawing = (event) => {
      isDrawingRef.current = false;
      canvasRef.current?.releasePointerCapture?.(event.pointerId);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.getContext("2d").beginPath();
      saveSignatureSnapshot();
    };

    const draw = (event) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (event.cancelable) {
        event.preventDefault();
      }

      const ctx = canvas.getContext("2d");
      const point = getPoint(event);

      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    };


    return (
      <div className="text-center" data-scroll-id={scrollId}>
        <div
          ref={containerRef}
          className="overflow-hidden rounded-xl bg-white"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
            className="h-40 w-full touch-none bg-white"
          />
        </div>
        <p className="mt-3 text-[15px] font-semibold text-slate-700">{label}</p>
        {errorMessage && (
          <p className="mt-1 text-xs font-medium text-red-500">{errorMessage}</p>
        )}
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

function ConfirmActionDialog({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 text-red-600">
          <i className="fas fa-triangle-exclamation text-xl"></i>
          <h4 className="text-lg font-bold">{title}</h4>
        </div>
        <p className="text-[15px] leading-7 text-slate-700">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetConfirmDialog({ onCancel, onConfirm }) {
  return (
    <ConfirmActionDialog
      title="ยืนยันการล้างฟอร์ม"
      message="ต้องการล้างข้อมูลที่กรอกทั้งหมดใช่หรือไม่"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

export default function ReportFooter({
  formData = {},
  handleChange,
  footerDraft = {},
  setFooterDraft,
  variant = "form1",
  authToken = "",
  onUnauthorized,
  onResetForm,
  validationErrors = {},
  setValidationErrors,
}) {
  const [remark, setRemark] = useState(footerDraft.generalRemark || "");
  const [inspectorDate, setInspectorDate] = useState(
    footerDraft.inspectorDate || "",
  );
  const [ownerDate, setOwnerDate] = useState(footerDraft.ownerDate || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationDialog, setValidationDialog] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [signatureClearTarget, setSignatureClearTarget] = useState(null);
  const [signatures, setSignatures] = useState({
    inspector: footerDraft.signatures?.inspector || null,
    owner: footerDraft.signatures?.owner || null,
  });
  const syncSignatureDatesRef = useRef(true);

  const inspectorSigRef = useRef();
  const ownerSigRef = useRef();

  // Sync state from props during render (React Best Practice for adjusting state from props)
  const [prevFooterDraft, setPrevFooterDraft] = useState(footerDraft);
  if (footerDraft !== prevFooterDraft) {
    setPrevFooterDraft(footerDraft);
    setRemark(footerDraft.generalRemark || "");
    setInspectorDate(footerDraft.inspectorDate || "");
    setOwnerDate(footerDraft.ownerDate || "");
    setSignatures({
      inspector: footerDraft.signatures?.inspector || null,
      owner: footerDraft.signatures?.owner || null,
    });
  }

  useEffect(() => {
    if (footerDraft.syncSignatureDates !== undefined) {
      syncSignatureDatesRef.current = footerDraft.syncSignatureDates !== false;
    }
  }, [footerDraft.syncSignatureDates]);

  useEffect(() => {
    const isDifferent =
      remark !== (footerDraft.generalRemark || "") ||
      inspectorDate !== (footerDraft.inspectorDate || "") ||
      ownerDate !== (footerDraft.ownerDate || "") ||
      signatures.inspector !== (footerDraft.signatures?.inspector || null) ||
      signatures.owner !== (footerDraft.signatures?.owner || null);

    if (isDifferent) {
      setFooterDraft?.({
        generalRemark: remark,
        inspectorDate,
        ownerDate,
        signatures,
        syncSignatureDates: syncSignatureDatesRef.current,
      });
    }
  }, [
    remark,
    inspectorDate,
    ownerDate,
    signatures,
    footerDraft.generalRemark,
    footerDraft.inspectorDate,
    footerDraft.ownerDate,
    footerDraft.signatures?.inspector,
    footerDraft.signatures?.owner,
    setFooterDraft,
  ]);

  useEffect(() => {
    const reportDateValue = String(formData.reportDate || "");
    const reportDateOnly = reportDateValue.includes("T")
      ? reportDateValue.split("T")[0]
      : reportDateValue;

    if (!reportDateOnly || !syncSignatureDatesRef.current) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (inspectorDate !== reportDateOnly) setInspectorDate(reportDateOnly);
    if (ownerDate !== reportDateOnly) setOwnerDate(reportDateOnly);
  }, [formData.reportDate, inspectorDate, ownerDate]);

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

  const isRemarkIncomplete = (item) => {
    const value = String(formData[`remark_${item.name}`] || "").trim();
    return !value;
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


      if (!String(inspectorDate || "").trim()) {
        setFieldError(
          errors,
          "signature-inspector",
          "กรุณาระบุข้อมูลผู้ตรวจสอบอาคารให้ครบถ้วน",
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
          "signature-owner",
          "กรุณาระบุข้อมูลเจ้าของอาคาร / ผู้ดูแลอาคารให้ครบถ้วน",
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

  const handleRadioToggle = (value) => {
    if (remark === value) {
      setRemark("");
    } else {
      setRemark(value);
      clearValidationError("remarkTemplate");
    }
  };

  const footerDialog = validationDialog ? (
    <ValidationDialog
      message={validationDialog.message}
      onClose={() => setValidationDialog(null)}
    />
  ) : null;

  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    onResetForm?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const requestResetForm = () => {
    setIsResetConfirmOpen(true);
  };

  const resetConfirmDialog = isResetConfirmOpen ? (
    <ResetConfirmDialog
      onCancel={() => setIsResetConfirmOpen(false)}
      onConfirm={handleConfirmReset}
    />
  ) : null;

  const handleConfirmClearSignature = () => {
    if (signatureClearTarget === "inspector") {
      inspectorSigRef.current?.clearSignature?.();
    }

    if (signatureClearTarget === "owner") {
      ownerSigRef.current?.clearSignature?.();
    }

    setSignatureClearTarget(null);
  };

  const signatureClearDialog = signatureClearTarget ? (
    <ConfirmActionDialog
      title="ยืนยันการล้างลายเซ็น"
      message="ต้องการล้างลายเซ็นนี้ใช่หรือไม่"
      onCancel={() => setSignatureClearTarget(null)}
      onConfirm={handleConfirmClearSignature}
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
                    initialSignatureData={signatures.inspector}
                    onSignatureChange={(value) =>
                      setSignatures((prev) => ({ ...prev, inspector: value }))
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSignatureClearTarget("inspector")}
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
                    initialSignatureData={signatures.owner}
                    onSignatureChange={(value) =>
                      setSignatures((prev) => ({ ...prev, owner: value }))
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSignatureClearTarget("owner")}
                className={`${signatureActionButtonClass} mt-3`}
              >
                <i className="fas fa-eraser"></i> ลบลายเซ็น
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex w-full max-w-[420px] flex-col gap-3">
            <button
              type="button"
              onClick={handleOpenDialog}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              <i className="fas fa-clipboard-check"></i>
              ตรวจสอบและจัดการรายงาน (Review & Manage)
            </button>
            <button
              type="button"
              onClick={requestResetForm}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-8 py-3.5 text-base font-bold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100"
            >
              <i className="fas fa-rotate-left"></i>
              ล้างฟอร์ม
            </button>
          </div>
        </div>

        {footerDialog}
        {resetConfirmDialog}
        {signatureClearDialog}

        <ManageReportDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onResetForm={requestResetForm}
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
              checked={remark === "พบปัญหาทั่วไปสามารถวางแผนกำหนดการแก้ไขได้ โดยจะส่งตามข้อมูลของโครงการภายหลัง"}
              onClick={() => handleRadioToggle("พบปัญหาทั่วไปสามารถวางแผนกำหนดการแก้ไขได้ โดยจะส่งตามข้อมูลของโครงการภายหลัง")}
              onChange={() => {}} // ป้องกัน React warning
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
              checked={remark === "ไม่พบปัญหา ณ วันที่ทำการตรวจสอบอาคาร"}
              onClick={() => handleRadioToggle("ไม่พบปัญหา ณ วันที่ทำการตรวจสอบอาคาร")}
              onChange={() => {}} // ป้องกัน React warning
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

        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <div className="text-center">
            <div className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
              <div className="p-4">
                <SignaturePad
                  ref={inspectorSigRef}
                  label="ผู้ตรวจสอบอาคาร (Inspector)"
                  scrollId="signature-inspector"
                  errorMessage={validationErrors["signature-inspector"]}
                  initialSignatureData={signatures.inspector}
                  onSignatureChange={(value) =>
                    setSignatures((prev) => ({ ...prev, inspector: value }))
                  }
                />
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
                    วันที่ตรวจสอบ (Inspection Date)
                  </label>
                  <input
                    type="date"
                    value={inspectorDate}
                    onChange={(e) => {
                      syncSignatureDatesRef.current = false;
                      setInspectorDate(e.target.value);
                      clearValidationError("signature-inspector");
                    }}
                    onClick={openNativePicker}
                    onFocus={openNativePicker}
                    className="w-full max-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-center text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSignatureClearTarget("inspector")}
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
                  scrollId="signature-owner"
                  errorMessage={validationErrors["signature-owner"]}
                  initialSignatureData={signatures.owner}
                  onSignatureChange={(value) =>
                    setSignatures((prev) => ({ ...prev, owner: value }))
                  }
                />
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
                    วันที่รับทราบ (Acknowledgement Date)
                  </label>
                  <input
                    type="date"
                    value={ownerDate}
                    onChange={(e) => {
                      syncSignatureDatesRef.current = false;
                      setOwnerDate(e.target.value);
                      clearValidationError("signature-owner");
                    }}
                    onClick={openNativePicker}
                    onFocus={openNativePicker}
                    className="w-full max-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-center text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSignatureClearTarget("owner")}
              className={`${signatureActionButtonClass} mt-3`}
            >
              <i className="fas fa-eraser"></i> ลบลายเซ็น
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex w-full max-w-[420px] flex-col gap-3">
          <button
            type="button"
            onClick={handleOpenDialog}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            <i className="fas fa-clipboard-check"></i>
            ตรวจสอบและจัดการรายงาน (Review & Manage)
          </button>
          <button
            type="button"
            onClick={requestResetForm}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-8 py-3.5 text-base font-bold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100"
          >
            <i className="fas fa-rotate-left"></i>
            ล้างฟอร์ม
          </button>
        </div>
      </div>

      {footerDialog}
      {resetConfirmDialog}
      {signatureClearDialog}

      <ManageReportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onResetForm={requestResetForm}
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
