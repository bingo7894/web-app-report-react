import React from "react";

const inspectionTypes = [
  "ตรวจสอบอาคาร",
  "ตรวจสอบป้าย",
  "ตรวจสอบใหญ่",
  "ตรวจสอบประจำปี",
  "ติดตามปัญหา",
];

const openNativePicker = (event) => {
  if (typeof event.currentTarget.showPicker === "function") {
    event.currentTarget.showPicker();
  }
};

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100";

export default function BuildingInspectionGeneralInfo({
  formData,
  handleChange,
  handleBlur,
  validationErrors = {},
}) {
  const getInputClassName = (fieldName) =>
    `${inputClassName} ${
      validationErrors[fieldName]
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : ""
    }`;

  return (
    <div className="mb-6 rounded-2xl border border-slate-300 bg-white px-5 py-6 shadow-sm md:px-6">
      <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 text-primary">
        <i className="fas fa-info-circle"></i>
        <h2 className="text-[18px] font-bold">ข้อมูลทั่วไป (General Info)</h2>
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
            onBlur={handleBlur}
            onClick={openNativePicker}
            onFocus={openNativePicker}
            className={`${getInputClassName("reportDate")} cursor-pointer`}
          />
          {validationErrors.reportDate && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.reportDate}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-[15px] font-semibold text-slate-900">
            ชื่อโครงการ (Project Name) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClassName("projectName")}
          />
          {validationErrors.projectName && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.projectName}
            </p>
          )}
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
            onBlur={handleBlur}
            className={getInputClassName("address")}
          />
          {validationErrors.address && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.address}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-[15px] font-semibold text-slate-900">
            ผู้ติดต่อ (Contact Name) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClassName("contactName")}
          />
          {validationErrors.contactName && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.contactName}
            </p>
          )}
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
            onBlur={handleBlur}
            inputMode="numeric"
            maxLength={10}
            placeholder="กรอกเบอร์โทร 10 หลัก"
            className={getInputClassName("phone")}
          />
          {validationErrors.phone && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.phone}
            </p>
          )}
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
            onBlur={handleBlur}
            autoComplete="email"
            placeholder="name@example.com"
            className={getInputClassName("email")}
          />
          {validationErrors.email && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.email}
            </p>
          )}
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
            onBlur={handleBlur}
            className={getInputClassName("lineId")}
          />
          {validationErrors.lineId && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.lineId}
            </p>
          )}
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
          {validationErrors.inspectionType && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.inspectionType}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
