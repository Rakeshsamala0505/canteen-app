import { useState } from "react";
import { supabase } from "../lib/supabase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error("Please enter your email address");
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess("Password reset email sent! Check your inbox for the reset link.");
      setEmail("");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email. Please try again.");
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
      padding: "32px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    }}>
      <h1 style={{
        fontSize: "26px",
        fontWeight: "700",
        color: "#2c3e50",
        textAlign: "center",
        marginBottom: "8px",
        letterSpacing: "-0.5px"
      }}>Forgot Password</h1>
      
      <p style={{
        fontSize: "14px",
        color: "#7f8c8d",
        textAlign: "center",
        marginBottom: "24px",
        fontWeight: "400"
      }}>Reset your account password</p>

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
        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label htmlFor="email" style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#2c3e50",
            marginBottom: "6px",
            display: "block",
            letterSpacing: "0.2px"
          }}>Enter your email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
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
          <p style={{ 
            fontSize: "12px", 
            color: "#7f8c8d", 
            marginTop: "6px",
            marginBottom: "0"
          }}>
            We'll send you a link to reset your password.
          </p>
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
          {loading ? "Sending..." : "Send Reset Email"}
        </button>

        <p style={{ 
          marginTop: "18px", 
          textAlign: "center",
          fontSize: "14px",
          color: "#7f8c8d"
        }}>
          Remember your password?{" "}
          <a href="/login" style={{
            color: "#c9a86a",
            textDecoration: "none",
            fontWeight: "600"
          }}>
            Back to Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;