import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import type { SignInData } from "../services/authService";
import { supabase } from "../lib/supabase";

// Fixed admin credentials
const ADMIN_EMAIL = "canteen@iimr.com";
const ADMIN_PASSWORD = "admin05";


const Login = () => {
    const [showPassword, setShowPassword] = useState(false); // ✅ HERE

  const [formData, setFormData] = useState<SignInData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      /* ================= ADMIN LOGIN ================= */
      if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
        sessionStorage.setItem(
          "adminSession",
          JSON.stringify({ email: ADMIN_EMAIL, isAdmin: true })
        );
        setSuccess("Admin login successful. Redirecting...");
        navigate("/admin");
        return;
      }

      /* ================= USER LOGIN ================= */
      const authData = await authService.signIn(formData);
      const user = authData?.session?.user;

      if (!user) {
        throw new Error("Login failed. Please try again.");
      }

      /* 🔒 EMAIL VERIFICATION CHECK */
      if (!user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error("Please verify your email before logging in.");
      }

      /* 🔒 PROFILE EXISTENCE CHECK */
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Your account is inactive or removed. Contact admin.");
      }

      /* ================= SUCCESS ================= */
      setSuccess("Login successful. Redirecting...");
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ 
      maxWidth: "370px", 
      marginTop: "7rem",
      background: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    }}>
      <h1 style={{
        fontSize: "26px",
        fontWeight: "700",
        color: "#2c3e50",
        textAlign: "center",
        marginBottom: "8px",
        letterSpacing: "-0.5px"
      }}>Welcome Back</h1>
      
      <p style={{
        fontSize: "14px",
        color: "#7f8c8d",
        textAlign: "center",
        marginBottom: "24px",
        fontWeight: "400"
      }}>Sign in to your account</p>

      {error && (
        <div className="notice notice-error" style={{
          padding: "10px 14px",
          borderRadius: "10px",
          marginBottom: "16px",
          fontSize: "13px",
          lineHeight: "1.5",
          fontWeight: "500",
          background: "#fee",
          color: "#c33",
          border: "1px solid #fcc"
        }}>{error}</div>
      )}
      
      {success && (
        <div className="notice notice-success" style={{
          padding: "10px 14px",
          borderRadius: "10px",
          marginBottom: "16px",
          fontSize: "13px",
          lineHeight: "1.5",
          fontWeight: "500",
          background: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb"
        }}>{success}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#2c3e50",
            marginBottom: "6px",
            display: "block",
            letterSpacing: "0.2px"
          }}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "11px 14px",
              fontSize: "15px",
              border: "2px solid #e1e8ed",
              borderRadius: "10px",
              outline: "none",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
              color: "#2c3e50",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#c9a86a";
              e.target.style.boxShadow = "0 0 0 3px rgba(201, 168, 106, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e1e8ed";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

       <div className="form-group" style={{ marginBottom: "20px", position: "relative" }}>
  <label style={{
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "6px",
    display: "block",
    letterSpacing: "0.2px"
  }}>Password</label>

  <input
    type={showPassword ? "text" : "password"}
    name="password"
    value={formData.password}
    onChange={handleChange}
    required
    style={{
      width: "100%",
      padding: "11px 40px 11px 14px", // space for eye icon
      fontSize: "15px",
      border: "2px solid #e1e8ed",
      borderRadius: "10px",
      outline: "none",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
      color: "#2c3e50",
      boxSizing: "border-box"
    }}
    onFocus={(e) => {
      e.target.style.borderColor = "#c9a86a";
      e.target.style.boxShadow = "0 0 0 3px rgba(201, 168, 106, 0.1)";
    }}
    onBlur={(e) => {
      e.target.style.borderColor = "#e1e8ed";
      e.target.style.boxShadow = "none";
    }}
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "12px",
      top: "38px",
      cursor: "pointer",
      fontSize: "18px",
      userSelect: "none"
    }}
  >
    {showPassword ? "🙈" : "👁️"}
  </span>
</div>


        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 20px",
            fontSize: "16px",
            fontWeight: "600",
            color: "#ffffff",
            background: "linear-gradient(135deg, #c9a86a 0%, #b89968 100%)",
            border: "none",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            letterSpacing: "0.5px",
            boxShadow: "0 4px 15px rgba(201, 168, 106, 0.3)",
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(201, 168, 106, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(201, 168, 106, 0.3)";
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ 
          marginTop: "18px", 
          textAlign: "center",
          fontSize: "14px",
          color: "#7f8c8d"
        }}>
          Don't have an account?{" "}
          <a href="/signup" style={{
            color: "#c9a86a",
            textDecoration: "none",
            fontWeight: "600"
          }}>Sign Up</a>
        </p>

        <p style={{ 
          textAlign: "center",
          marginTop: "8px",
          fontSize: "14px"
        }}>
          <a href="/forgot-password" style={{
            color: "#c9a86a",
            textDecoration: "none",
            fontWeight: "600"
          }}>Forgot password?</a>
        </p>
      </form>
    </div>
  );
};

export default Login;