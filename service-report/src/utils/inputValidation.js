const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizePhoneInput(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

export function isValidPhone(value) {
  return /^\d{10}$/.test(String(value || "").trim());
}

export function isValidEmail(value) {
  return emailPattern.test(String(value || "").trim());
}

export function getFieldValidationMessage(fieldName, formData, variant = "form1") {
  const value = String(formData[fieldName] || "").trim();

  const requiredMessages = {
    reportDate: "กรุณาระบุวันที่",
    projectName: "กรุณาระบุชื่อโครงการ",
    address: "กรุณาระบุที่ตั้ง",
    contactName: "กรุณาระบุชื่อผู้ติดต่อ",
    phone: "กรุณาระบุเบอร์โทร",
    email: "กรุณาระบุ Email",
    lineId: "กรุณาระบุ ID Line",
    operatedBy: "กรุณาระบุผู้ปฏิบัติงาน",
    jobType2: "กรุณาเลือกประเภทงาน",
    jobTypeOther: "กรุณาระบุรายละเอียดประเภทงาน",
    serviceRendered: "กรุณาระบุรายการงานที่ดำเนินการ",
    overallStatus: "กรุณาเลือกสถานะโดยรวม",
    overallStatusAction: "กรุณาเลือกแนวทางดำเนินการเมื่อสถานะใช้ไม่ได้",
    overallStatusOther: "กรุณาระบุรายละเอียดเพิ่มเติมของสถานะใช้ไม่ได้",
    endTime: "กรุณาระบุเวลาสิ้นสุดงาน",
    inspectionType: "กรุณาเลือกประเภทการตรวจสอบ",
  };

  if (requiredMessages[fieldName] && !value) {
    if (fieldName === "jobTypeOther" && formData.jobType2 !== "other") return "";
    if (
      fieldName === "overallStatusAction" &&
      formData.overallStatus !== "ใช้ไม่ได้"
    ) {
      return "";
    }
    if (
      fieldName === "overallStatusOther" &&
      !(formData.overallStatus === "ใช้ไม่ได้" && formData.overallStatusAction === "other")
    ) {
      return "";
    }
    return requiredMessages[fieldName];
  }

  if (fieldName === "phone" && value && !isValidPhone(value)) {
    return "กรุณาระบุเบอร์โทรเป็นตัวเลข 10 หลัก";
  }

  if (fieldName === "email" && value && !isValidEmail(value)) {
    return "กรุณาระบุ Email ให้ถูกต้องตามรูปแบบ";
  }

  if (
    variant === "form2" &&
    fieldName === "problemDetail" &&
    formData.overallStatus === "ใช้ไม่ได้" &&
    !value
  ) {
    return "กรุณาระบุรายละเอียดปัญหาที่พบ";
  }

  return "";
}
