import React from "react";
import LoginPage from "./pages/LoginPage";
import ReportPage from "./pages/ReportPage";
import { useAuthSession } from "./hooks/useAuthSession";

function App() {
  const {
    authState,
    isAuthLoading,
    isLoginSubmitting,
    authNotice,
    login,
    logout,
    clearAuthNotice,
  } = useAuthSession();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-800">
            กำลังตรวจสอบ session...
          </p>
        </div>
      </div>
    );
  }

  if (!authState.token) {
    return (
      <LoginPage
        onLogin={login}
        isLoading={isLoginSubmitting}
        sessionNotice={authNotice}
        onDismissNotice={clearAuthNotice}
      />
    );
  }

  return <ReportPage authState={authState} onLogout={logout} />;
}

export default App;
