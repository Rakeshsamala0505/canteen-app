import { Navigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "user" | "admin";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, initializing } = useAuthContext();

  const adminSession = sessionStorage.getItem("adminSession");

  if (initializing) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // allow user OR admin
  if (!user && !adminSession) {
    return <Navigate to="/login" replace />;
  }

  // admin-only routes
  if (requiredRole === "admin" && !adminSession) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
