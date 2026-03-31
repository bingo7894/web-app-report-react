import React, { useEffect, useRef, useState } from "react";
import BuildingChecklistForm from "../components/BuildingChecklistForm";
import GeneralServiceForm from "../components/GeneralServiceForm";
import BuildingInspectionGeneralInfo from "../components/BuildingInspectionGeneralInfo";
import ReportFooter from "../components/ReportFooter";
import {
  getFieldValidationMessage,
  sanitizePhoneInput,
} from "../utils/inputValidation";
import {
  clearReportDraft,
  loadReportDraft,
  saveReportDraft,
} from "../utils/reportDraftStorage";

const initialFormData = {
  formType: "form1",
  reportDate: "",
  codeNo: "",
  projectName: "",
  address: "",
  contactName: "",
  phone: "",
  operatedBy: "",
  email: "",
  lineId: "",
  inspectionType: "",
  jobType2: "",
  jobTypeOther: "",
  serviceRendered: "",
  serviceRemark: "",
  problemDetail: "",
  engineerRemark: "",
  customerFeedback: "",
  drawingData: "",
  overallStatus: "",
  overallStatusAction: "",
  overallStatusOther: "",
  endTime: "",
};

function createInitialFormData() {
  return { ...initialFormData };
}

function createInitialFooterDraft() {
  return {
    generalRemark: "",
    inspectorDate: "",
    ownerDate: "",
    signatures: {
      inspector: null,
      owner: null,
    },
    syncSignatureDates: true,
  };
}

export default function ReportPage({ authState, onLogout }) {
  const draftKeyUser = authState.user?.email || "guest";
  const [formData, setFormData] = useState(() => {
    const draft = loadReportDraft(draftKeyUser);
    return {
      ...createInitialFormData(),
      ...(draft?.formData || {}),
    };
  });
  const [footerDraft, setFooterDraft] = useState(() => {
    const draft = loadReportDraft(draftKeyUser);
    return {
      ...createInitialFooterDraft(),
      ...(draft?.footerDraft || {}),
      signatures: {
        ...createInitialFooterDraft().signatures,
        ...(draft?.footerDraft?.signatures || {}),
      },
    };
  });
  const [validationErrors, setValidationErrors] = useState({});
  const latestDraftRef = useRef({
    formData,
    footerDraft,
  });

  const applyDefaultDates = (data) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const defaultDateTime = now.toISOString().slice(0, 16);

    return {
      ...data,
      reportDate: data.reportDate || defaultDateTime,
      endTime: data.endTime || defaultDateTime,
    };
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "phone" ? sanitizePhoneInput(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;

      const nextErrors = { ...prev };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "phone" ? sanitizePhoneInput(value) : value;
    const nextFormData = { ...formData, [name]: nextValue };
    const message = getFieldValidationMessage(
      name,
      nextFormData,
      formData.formType,
    );

    setValidationErrors((prev) => {
      const nextErrors = { ...prev };
      if (message) {
        nextErrors[name] = message;
      } else {
        delete nextErrors[name];
      }
      return nextErrors;
    });
  };

  useEffect(() => {
    setFormData((prev) => applyDefaultDates(prev));
  }, []);

  useEffect(() => {
    const draft = loadReportDraft(draftKeyUser);

    setFormData(
      applyDefaultDates({
        ...createInitialFormData(),
        ...(draft?.formData || {}),
      }),
    );
    setFooterDraft({
      ...createInitialFooterDraft(),
      ...(draft?.footerDraft || {}),
      signatures: {
        ...createInitialFooterDraft().signatures,
        ...(draft?.footerDraft?.signatures || {}),
      },
    });
    setValidationErrors({});
  }, [draftKeyUser]);

  useEffect(() => {
    latestDraftRef.current = {
      formData,
      footerDraft,
    };
    saveReportDraft(draftKeyUser, latestDraftRef.current);
  }, [draftKeyUser, formData, footerDraft]);

  useEffect(() => {
    const persistLatestDraft = () => {
      saveReportDraft(draftKeyUser, latestDraftRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistLatestDraft();
      }
    };

    window.addEventListener("pagehide", persistLatestDraft);
    window.addEventListener("beforeunload", persistLatestDraft);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", persistLatestDraft);
      window.removeEventListener("beforeunload", persistLatestDraft);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [draftKeyUser]);

  const handleResetForm = () => {
    setFormData(applyDefaultDates(createInitialFormData()));
    setFooterDraft(createInitialFooterDraft());
    setValidationErrors({});
    clearReportDraft(draftKeyUser);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[860px] bg-slate-50 p-4 font-sarabun text-slate-900">
      <header className="mb-7 flex flex-col gap-4 print:hidden">
        <div className="flex items-center justify-between rounded-2xl border border-slate-300 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Signed in
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {authState.user?.email || "Unknown user"}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
          >
            ออกจากระบบ
          </button>
        </div>

        <div className="flex items-center gap-6 rounded-2xl border border-slate-300 bg-white px-6 py-7 shadow-sm md:gap-8 md:px-7">
          <img
            src="/img/Logo.jpg"
            alt="Logo"
            className="h-20 w-[132px] shrink-0 object-contain md:h-24 md:w-[150px]"
          />
          <div className="flex flex-col justify-center">
            <h1 className="m-0 text-[28px] font-bold leading-tight text-primary md:text-[31px]">
              Service Report System
            </h1>
            <p className="m-0 mt-3 text-[15px] leading-relaxed text-secondary md:text-[17px]">
              ระบบรายงานการให้บริการและตรวจสอบข้อมูลอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Menu Navigation Box */}
        <div className="rounded-2xl border border-slate-300 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              disabled
              className="h-12 w-full rounded-xl bg-slate-200 px-6 text-[15px] font-bold text-slate-600 shadow-inner transition"
              title="เมนูยังไม่พร้อมใช้งาน"
            >
              Menu A (Coming soon)
            </button>
            <button
              type="button"
              className="h-12 w-full rounded-xl bg-primary px-6 text-[15px] font-bold text-white shadow-md transition hover:bg-blue-800"
            >
              Service Report
            </button>
            <button
              type="button"
              disabled
              className="h-12 w-full rounded-xl bg-slate-200 px-6 text-[15px] font-bold text-slate-600 shadow-inner transition"
              title="เมนูยังไม่พร้อมใช้งาน"
            >
              Menu C (Coming soon)
            </button>
          </div>
        </div>

        {/* Form Selection Box */}
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-300 bg-white px-6 py-5 font-semibold text-primary shadow-sm md:flex-row md:items-center md:px-8">
          <label className="text-[16px]">
            <i className="fas fa-layer-group"></i> เลือกแบบฟอร์ม:
          </label>
          <select
            name="formType"
            value={formData.formType}
            onChange={handleChange}
            className="w-full max-w-[320px] rounded-xl border border-blue-300 bg-white px-5 py-3 text-base font-sarabun font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
          >
            <option value="form1">1.1 แบบตรวจสอบอาคาร</option>
            <option value="form2">1.2 แบบงานบริการทั่วไป</option>
          </select>
        </div>
      </header>

      <main className="print:hidden">
        {formData.formType === "form1" ? (
          <>
            <BuildingInspectionGeneralInfo
              formData={formData}
              handleChange={handleChange}
              handleBlur={handleBlur}
              validationErrors={validationErrors}
            />
            <BuildingChecklistForm
              formData={formData}
              handleChange={handleChange}
              handleBlur={handleBlur}
              validationErrors={validationErrors}
            />
            <div className="mt-6">
              <ReportFooter
                formData={formData}
                handleChange={handleChange}
                footerDraft={footerDraft}
                setFooterDraft={setFooterDraft}
                authToken={authState.token}
                onUnauthorized={onLogout}
                onResetForm={handleResetForm}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
              />
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <GeneralServiceForm
              formData={formData}
              handleChange={handleChange}
              handleBlur={handleBlur}
              validationErrors={validationErrors}
            />
            <ReportFooter
              formData={formData}
              handleChange={handleChange}
              footerDraft={footerDraft}
              setFooterDraft={setFooterDraft}
              variant="form2"
              authToken={authState.token}
              onUnauthorized={onLogout}
              onResetForm={handleResetForm}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
            />
          </div>
        )}
      </main>
    </div>
  );
}
