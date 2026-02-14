import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/global.css";
import Header from "./components/Header";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import UserHome from "./pages/UserHome";
import AdminPage from "./pages/AdminPage";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import  { useState, useEffect } from "react";





const AppInner = () => {
  const { initializing } = useAuthContext();

  // ✅ ADD HERE (inside component)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  // ✅ ADD THIS useEffect HERE
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // ✅ ADD install handler here
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstall(false);
    }

    setDeferredPrompt(null);
  };

  if (initializing) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ marginBottom: 12 }} />
          <div>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />

      {/* ✅ INSTALL BUTTON */}
      {showInstall && (
        <button
          onClick={handleInstall}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            padding: "10px 16px",
            borderRadius: 10,
            background: "#28a745",
            color: "#fff",
            border: "none",
            fontWeight: 700,
            zIndex: 9999,
          }}
        >
          Install App
        </button>
      )}

      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <UserHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
