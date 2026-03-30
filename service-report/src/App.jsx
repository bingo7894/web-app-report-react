import React, { useState, useEffect } from "react";
import FormChecklist from "./components/FormChecklist";
import FormGeneralService from "./components/FormGeneralService";
import ReportFooter from "./components/ReportFooter";
function App() {
  const inspectionTypes = [
    "ตรวจสอบอาคาร",
    "ตรวจสอบป้าย",
    "ตรวจสอบใหญ่",
    "ตรวจสอบประจำปี",
    "ติดตามปัญหา",
  ];

  // 1. สร้าง State สำหรับเก็บข้อมูลฟอร์มทั้งหมด (แทนการไปดึงค่าจาก document.getElementById)
  const [formData, setFormData] = useState({
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
  });

  // 2. ฟังก์ชันสำหรับอัปเดตข้อมูลเวลาผู้ใช้พิมพ์กรอกฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. ตั้งค่าวันที่และเวลาปัจจุบันให้เป็นค่าเริ่มต้น
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormData((prev) => ({
      ...prev,
      reportDate: now.toISOString().slice(0, 16),
    }));
  }, []);

  return (
    // คลาสพวกนี้คือ Tailwind CSS ที่มาแทน style.css เดิมครับ
    <div className="max-w-[860px] mx-auto p-4 font-sarabun bg-slate-50 text-slate-900 min-h-screen">
      {/* ── ส่วนหัว (Header) ── */}
      <header className="mb-7 flex flex-col gap-4 print:hidden">
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

        {/* ปุ่มเลือกแบบฟอร์ม */}
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
            {/* ── ส่วนข้อมูลทั่วไป (General Info) ── */}
            <div className="mb-6 rounded-2xl border border-slate-300 bg-white px-5 py-6 shadow-sm md:px-6">
              <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 text-primary">
                <i className="fas fa-info-circle"></i>
                <h2 className="text-[18px] font-bold">
                  ข้อมูลทั่วไป (General Info)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-900">
                    วันที่ (Date) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="reportDate"
                    value={formData.reportDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[15px] font-semibold text-slate-900">
                    ชื่อโครงการ (Project Name){" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[15px] font-semibold text-slate-900">
                    ที่ตั้ง (Address) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-900">
                    ผู้ติดต่อ (Contact Name){" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-900">
                    เบอร์โทร (Mobile) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-900">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-900">
                    ID Line <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="lineId"
                    value={formData.lineId}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="mt-2 md:col-span-2">
                  <label className="mb-3 block text-[15px] font-semibold text-slate-900">
                    ประเภทการตรวจสอบ
                    <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {inspectionTypes.map((type) => (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-2 text-[15px] text-slate-900"
                      >
                        <input
                          type="radio"
                          name="inspectionType"
                          value={type}
                          checked={formData.inspectionType === type}
                          onChange={handleChange}
                          className="h-4 w-4 text-[#1a237e] focus:ring-primary"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <FormChecklist formData={formData} handleChange={handleChange} />

            <div className="mt-6">
              <ReportFooter formData={formData} handleChange={handleChange} />
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <FormGeneralService
              formData={formData}
              handleChange={handleChange}
            />
            <ReportFooter
              formData={formData}
              handleChange={handleChange}
              variant="form2"
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
