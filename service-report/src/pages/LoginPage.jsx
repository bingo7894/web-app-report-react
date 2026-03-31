import React, { useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 hover:border-slate-300";

export default function LoginPage({
  onLogin,
  isLoading = false,
  sessionNotice = "",
  onDismissNotice,
}) {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!credentials.email.trim() || !credentials.password.trim()) {
      setErrorMessage("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    const result = await onLogin(credentials);
    if (!result.ok) {
      setErrorMessage(result.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 text-slate-900 font-sans">
      <div className="w-full max-w-[960px] bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Section - Branding & Info (Light Blue Theme) */}
        <section className="flex items-center justify-center bg-blue-50/60 p-8 md:p-12 lg:border-r lg:border-blue-100">
          <div className="w-full max-w-[340px]">
            {/* Header */}
            <div className="flex items-center gap-4">
              {/* ปรับขนาดกล่องโลโก้ให้ใหญ่ขึ้นตรงนี้ (h-20 w-20) */}
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm border border-blue-100 shrink-0">
                <img
                  src="/img/Logo.jpg"
                  alt="Service Report Logo"
                  className="h-14 w-14 object-contain" /* ปรับขนาดรูปให้ใหญ่ขึ้น */
                />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
                  Service Report
                </p>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  ระบบรายงานงานบริการ
                </h1>
              </div>
            </div>

            <p className="mt-5 text-[14px] leading-relaxed text-slate-600">
              เข้าสู่ระบบเพื่อใช้งานแบบฟอร์มรายงาน สร้างเอกสาร PDF
              และจัดการข้อมูลส่งไปยังระบบ Backend ได้อย่างรวดเร็วและปลอดภัย
            </p>

            {/* QR Code Contact */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Contact Support
                </p>
                <p className="text-[13px] font-medium text-slate-800 mt-0.5">
                  Scan QR Code (Line)
                </p>
              </div>
              <div className="rounded-xl border border-blue-50 bg-blue-50/50 p-3">
                <img
                  src="/img/qrline.jpg"
                  alt="QR Code"
                  className="mx-auto aspect-square w-full max-w-[140px] rounded-lg object-cover mix-blend-multiply"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right Section - Login Form */}
        <section className="flex items-center justify-center p-8 md:p-12 bg-white">
          <div className="w-full max-w-[340px]">
            <div className="mb-8">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-2">
                Welcome Back
              </p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                เข้าสู่ระบบ
              </h2>
              <p className="mt-2 text-[14px] text-slate-500">
                ใช้อีเมลและรหัสผ่านเพื่อเข้าใช้งานระบบ
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {sessionNotice && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="mt-0.5 h-4 w-4 shrink-0 opacity-80"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 0010 6zm0 7.5a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <span>{sessionNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onDismissNotice}
                    className="text-amber-500 transition hover:text-amber-700"
                  >
                    <span className="sr-only">ปิดข้อความแจ้งเตือน</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M6.28 5.22a.75.75 0 011.06 0L10 7.94l2.66-2.72a.75.75 0 111.08 1.04L11.06 9l2.68 2.72a.75.75 0 11-1.08 1.04L10 10.06l-2.66 2.7a.75.75 0 01-1.08-1.04L8.94 9 6.28 6.26a.75.75 0 010-1.04z" />
                    </svg>
                  </button>
                </div>
              )}

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={inputClassName}
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className={inputClassName}
                  placeholder="••••••••"
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600 flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 mt-0.5 opacity-80 shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-blue-800 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : (
                  "ลงชื่อเข้าใช้"
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
