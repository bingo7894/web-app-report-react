import React, { useEffect, useRef, useState } from "react";

const workTypeOptions = [
  "ระบบไฟฟ้า",
  "ระบบป้องกันอันตรายจากฟ้าผ่า",
  "ระบบควบคุมควันไฟ",
  "ความมั่นคงแข็งแรงอาคาร",
  "อื่นๆ (โปรดระบุ)",
];

const overallStatusActions = [
  "เร่งด่วน",
  "ไม่เร่งด่วน",
  "ต้องอยู่ในแผนดำเนินการ",
  "อื่นๆ (ระบุ)",
];

function SectionCard({ iconClass, title, englishTitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-white px-5 py-6 shadow-sm md:px-6">
      <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 text-primary">
        <i className={iconClass}></i>
        <h2 className="text-[18px] font-bold">
          {title} ({englishTitle})
        </h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, englishLabel, required = false, children }) {
  return (
    <div>
      <label className="mb-2 block text-[15px] font-semibold text-slate-900">
        {englishLabel ? `${label} (${englishLabel})` : label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100";

const openNativePicker = (event) => {
  if (typeof event.currentTarget.showPicker === "function") {
    event.currentTarget.showPicker();
  }
};

function DrawingPad({ value, onChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const redraw = (ctx, src) => {
      if (!src) return;

      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = src;
    };

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width - 2;
      canvas.height = 220;

      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      redraw(ctx, value);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [value]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(event);
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    canvas.getContext("2d").beginPath();
    onChange?.(canvas.toDataURL("image/png"));
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange?.("");
  };

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="h-[220px] w-full touch-none bg-white"
        />
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={clearDrawing}
          className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          ล้างภาพ
        </button>
      </div>
    </div>
  );
}

export default function FormGeneralService({ formData, handleChange }) {
  const updateField = (name, value) => {
    handleChange({
      target: {
        name,
        value,
      },
    });
  };

  const handleDrawingChange = (drawingData) => {
    updateField("drawingData", drawingData);
  };

  const handleJobTypeChange = (event) => {
    const { value } = event.target;
    updateField("jobType2", value);

    if (value !== "other") {
      updateField("jobTypeOther", "");
    }
  };

  const handleOverallStatusChange = (event) => {
    const { value } = event.target;
    updateField("overallStatus", value);

    if (value !== "ใช้ไม่ได้") {
      updateField("overallStatusAction", "");
      updateField("overallStatusOther", "");
    }
  };

  const handleOverallStatusActionChange = (event) => {
    const { value } = event.target;
    updateField("overallStatusAction", value);

    if (value !== "other") {
      updateField("overallStatusOther", "");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <SectionCard
        iconClass="fas fa-info-circle"
        title="ข้อมูลทั่วไป"
        englishTitle="General Info"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="วันที่" englishLabel="Date" required>
            <input
              type="datetime-local"
              name="reportDate"
              value={formData.reportDate}
              onChange={handleChange}
              onClick={openNativePicker}
              onFocus={openNativePicker}
              className={`${inputClassName} cursor-pointer`}
            />
          </Field>

          <Field label="CODE NO." englishLabel="" required={false}>
            <input
              type="text"
              name="codeNo"
              value={formData.codeNo}
              onChange={handleChange}
              className={inputClassName}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="ชื่อโครงการ" englishLabel="Project Name" required>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className={inputClassName}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="ที่ตั้ง" englishLabel="Address" required>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={inputClassName}
              />
            </Field>
          </div>

          <Field label="ผู้ติดต่อ" englishLabel="Contact Name" required>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              className={inputClassName}
            />
          </Field>

          <Field label="เบอร์โทร" englishLabel="Mobile" required>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClassName}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="ปฏิบัติงาน" englishLabel="Operated By" required>
              <input
                type="text"
                name="operatedBy"
                value={formData.operatedBy}
                onChange={handleChange}
                placeholder="ชื่อวิศวกร / ช่างผู้ปฏิบัติงาน"
                className={inputClassName}
              />
            </Field>
          </div>

          <Field label="Email" englishLabel="" required>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClassName}
            />
          </Field>

          <Field label="ID Line" englishLabel="" required>
            <input
              type="text"
              name="lineId"
              value={formData.lineId}
              onChange={handleChange}
              className={inputClassName}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="ประเภทงาน" englishLabel="Type of Work" required>
              <select
                name="jobType2"
                value={formData.jobType2}
                onChange={handleJobTypeChange}
                className={inputClassName}
              >
                <option value="">-- เลือกประเภทงาน --</option>
                {workTypeOptions.map((option) => (
                  <option
                    key={option}
                    value={option === "อื่นๆ (โปรดระบุ)" ? "other" : option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {formData.jobType2 === "other" && (
            <div className="md:col-span-2">
              <Field
                label="รายละเอียดประเภทงาน"
                englishLabel="Other Type of Work"
                required
              >
                <input
                  type="text"
                  name="jobTypeOther"
                  value={formData.jobTypeOther}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </Field>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        iconClass="fas fa-cogs"
        title="รายละเอียดการทำงาน"
        englishTitle="Service Details"
      >
        <div className="space-y-5">
          <Field label="รายการ" englishLabel="Service Rendered">
            <textarea
              name="serviceRendered"
              value={formData.serviceRendered}
              onChange={handleChange}
              rows="5"
              placeholder="รายการงานที่ดำเนินการ..."
              className={`${inputClassName} resize-y`}
            />
          </Field>

          <Field label="หมายเหตุ" englishLabel="Remark">
            <textarea
              name="serviceRemark"
              value={formData.serviceRemark}
              onChange={handleChange}
              rows="4"
              placeholder="หมายเหตุเพิ่มเติม..."
              className={`${inputClassName} resize-y`}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        iconClass="fas fa-exclamation-triangle"
        title="ปัญหาที่พบ"
        englishTitle="Nature of Problem"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="รายละเอียด" englishLabel="Detail Problem Reported">
              <textarea
                name="problemDetail"
                value={formData.problemDetail}
                onChange={handleChange}
                rows="5"
                placeholder="รายละเอียดปัญหาที่พบ..."
                className={`${inputClassName} resize-y`}
              />
            </Field>

            <Field label="ความเห็นวิศวกร" englishLabel="Engineer's Remarks">
              <textarea
                name="engineerRemark"
                value={formData.engineerRemark}
                onChange={handleChange}
                rows="4"
                placeholder="ความเห็น/ข้อเสนอแนะจากวิศวกร..."
                className={`${inputClassName} resize-y`}
              />
            </Field>

            <Field label="ความเห็นลูกค้า" englishLabel="Customer Feedback">
              <textarea
                name="customerFeedback"
                value={formData.customerFeedback}
                onChange={handleChange}
                rows="4"
                placeholder="ความเห็น/ข้อเสนอแนะจากลูกค้า..."
                className={`${inputClassName} resize-y`}
              />
            </Field>
          </div>

          <div className="space-y-4">
            <Field label="Drawing" englishLabel="วาดผังหน้างาน">
              <DrawingPad
                value={formData.drawingData}
                onChange={handleDrawingChange}
              />
            </Field>

            <Field label="สถานะโดยรวม" englishLabel="Status after Service">
              <div className="space-y-3 pt-2 text-[16px] text-slate-900">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="overallStatus"
                    value="ใช้ได้"
                    checked={formData.overallStatus === "ใช้ได้"}
                    onChange={handleOverallStatusChange}
                  />
                  ใช้ได้
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="overallStatus"
                    value="ใช้ไม่ได้"
                    checked={formData.overallStatus === "ใช้ไม่ได้"}
                    onChange={handleOverallStatusChange}
                  />
                  ใช้ไม่ได้
                </label>

                {formData.overallStatus === "ใช้ไม่ได้" && (
                  <div className="ml-2 border-l-4 border-red-500 pl-4">
                    <div className="space-y-3">
                      {overallStatusActions.map((option) => {
                        const radioValue =
                          option === "อื่นๆ (ระบุ)" ? "other" : option;

                        return (
                          <label
                            key={option}
                            className="flex items-center gap-2 text-[16px] text-slate-900"
                          >
                            <input
                              type="radio"
                              name="overallStatusAction"
                              value={radioValue}
                              checked={formData.overallStatusAction === radioValue}
                              onChange={handleOverallStatusActionChange}
                            />
                            {option}
                          </label>
                        );
                      })}

                      {formData.overallStatusAction === "other" && (
                        <input
                          type="text"
                          name="overallStatusOther"
                          value={formData.overallStatusOther}
                          onChange={handleChange}
                          placeholder="ระบุรายละเอียดเพิ่มเติม"
                          className={inputClassName}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Field>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
