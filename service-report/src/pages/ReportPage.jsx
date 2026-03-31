import React, { useEffect, useState } from "react";
import BuildingChecklistForm from "../components/BuildingChecklistForm";
import GeneralServiceForm from "../components/GeneralServiceForm";
import BuildingInspectionGeneralInfo from "../components/BuildingInspectionGeneralInfo";
import ReportFooter from "../components/ReportFooter";

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

export default function ReportPage({ authState, onLogout }) {
  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormData((prev) => ({
      ...prev,
      reportDate: now.toISOString().slice(0, 16),
    }));
  }, []);

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

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-300 bg-white px-5 py-4 font-semibold text-primary md:flex-row md:justify-center">
          <label className="text-[16px]">
            <i className="fas fa-layer-group"></i> เลือกแบบฟอร์ม:
          </label>
          <select
            name="formType"
            value={formData.formType}
            onChange={handleChange}
            className="w-full max-w-[320px] rounded-xl border border-blue-300 bg-white px-5 py-3 text-base font-sarabun font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
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
            />
            <BuildingChecklistForm
              formData={formData}
              handleChange={handleChange}
            />
            <div className="mt-6">
              <ReportFooter
                formData={formData}
                handleChange={handleChange}
                authToken={authState.token}
                onUnauthorized={onLogout}
              />
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <GeneralServiceForm
              formData={formData}
              handleChange={handleChange}
            />
            <ReportFooter
              formData={formData}
              handleChange={handleChange}
              variant="form2"
              authToken={authState.token}
              onUnauthorized={onLogout}
            />
          </div>
        )}
      </main>
    </div>
  );
}
