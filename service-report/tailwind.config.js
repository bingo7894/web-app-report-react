/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sarabun: ["Sarabun", "sans-serif"],
      },
      colors: {
        primary: "#1e40af", // สีหลักของคุณ
        "primary-hover": "#1e3a8a",
        secondary: "#64748b",
        success: "#16a34a",
        error: "#dc2626",
      },
    },
  },
  plugins: [],
};
