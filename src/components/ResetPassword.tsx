import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a valid session from the reset email link
    const checkSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          setIsValidSession(true);
        } else {
          setError("Invalid or expired reset link. Please request a new password reset.");
        }
      } catch (err) {
        setError("Failed to verify reset link. Please try again.");
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!password || !confirmPassword) {
        throw new Error("Please enter and confirm your password");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess("Password updated successfully! Redirecting to login...");
      
      // Sign out the user and redirect to login
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession && !error) {
    return (
      <div className="container" style={{ maxWidth: "400px", marginTop: "2rem" }}>
        <p style={{ textAlign: "center", color: "var(--text-light)" }}>Verifying reset link...</p>
      </div>
    );
  }

  if (error && !isValidSession) {
    return (
      <div className="container" style={{ maxWidth: "400px", marginTop: "2rem" }}>
        <h1>Reset Password</h1>
        <div className="notice notice-error">{error}</div>
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          <a href="/forgot-password" style={{ color: "var(--primary)", textDecoration: "none" }}>
            Request a new reset link
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "400px", marginTop: "2rem" }}>
      <h1>Reset Password</h1>
      {error && <div className="notice notice-error">{error}</div>}
      {success && <div className="notice notice-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !isValidSession}>
          {loading ? "Updating..." : "Update Password"}
        </button>

        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          <a href="/login" style={{ color: "var(--primary)", textDecoration: "none" }}>
            Back to Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;
