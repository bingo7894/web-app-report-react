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
