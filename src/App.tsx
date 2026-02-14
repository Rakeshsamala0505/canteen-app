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
import { useState, useEffect } from "react";

const AppInner = () => {
  const { initializing } = useAuthContext();

  // 📲 Android PWA install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  // 🍎 iOS install hint
  const [showIOSHint, setShowIOSHint] = useState(false);

  // 🔔 Listen for Android install availability
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setShowInstall(false));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // ✅ Hide button if already installed
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstall(false);
    }
  }, []);

  // 📱 Detect iOS Safari
  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone = (window.navigator as any).standalone;

    if (isIOS && !isInStandalone) {
      setShowIOSHint(true);
    }
  }, []);

  // 🚀 Trigger Android install
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

      {/* 🍎 iOS install message */}
      {showIOSHint && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: 20,
            right: 20,
            background: "#000",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            textAlign: "center",
            fontSize: 14,
            zIndex: 9999,
          }}
        >
          Tap <b>Share</b> → <b>Add to Home Screen</b> to install the app 📲
        </div>
      )}

      {/* 🤖 Android install button */}
      {showInstall && (
        <button
          onClick={handleInstall}
          style={{
            position: "fixed",
            bottom: 10,
            right: 150,
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
