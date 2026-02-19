import { useState } from "react";
import type { SignUpData } from "../services/authService";
import { supabase } from "../lib/supabase";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<SignUpData>({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      setSuccess("");
      if (!formData.name || !formData.phone || !formData.email || !formData.password) {
        throw new Error("All fields are required");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Check if user already exists in users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingUser) {
        setDuplicateEmail(true);
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) {
        const msg = String(authError.message || "").toLowerCase();
        const isDuplicate =
          msg.includes("already") ||
          msg.includes("user already") ||
          msg.includes("duplicate");
        if (isDuplicate) {
          setDuplicateEmail(true);
          setError("");
          setSuccess("");
          setLoading(false);
          return;
        }
        throw authError;
      }

      if (!authData?.user) {
        throw new Error("Signup failed. Please try again.");
      }

      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          is_admin: false,
        },
      ]);

      if (profileError) {
        throw new Error("Account created but profile setup failed. Contact admin.");
      }

      setSuccess("Check your email to confirm signup. After confirmation you can log in.");
      setError("");
    } catch (err: any) {
      setError(err?.message || "Failed to sign up. Please try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "88vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
        padding: "16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          padding: "20px 26px 18px",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#2c3e50",
              margin: "0 0 2px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Create Account
          </h1>
          <p style={{ fontSize: "17px", color: "#7f8c8d", fontWeight: "400", margin: "0" }}>
            Join IIMR Canteen today
          </p>
        </div>

        {/* Notices */}
        {duplicateEmail && (
          <div
            style={{
              padding: "7px 11px",
              borderRadius: "7px",
              marginBottom: "10px",
              fontSize: "11px",
              lineHeight: "1.3",
              fontWeight: "500",
              background: "#fee",
              color: "#c33",
              border: "1px solid #fcc",
            }}
          >
            This email is already registered. Please{" "}
            <a
              href="/login"
              style={{ color: "#ff0000", textDecoration: "underline", fontWeight: "600", fontSize: "13px" }}
            >
              log in
            </a>{" "}
            or{" "}
            <a
              href="/forgot-password"
              style={{ color: "#ff0000", textDecoration: "underline", fontWeight: "600", fontSize: "13px" }}
            >
              reset your password
            </a>
            .
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "7px 11px",
              borderRadius: "7px",
              marginBottom: "10px",
              fontSize: "11px",
              lineHeight: "1.3",
              fontWeight: "500",
              background: "#fee",
              color: "#c33",
              border: "1px solid #fcc",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "7px 11px",
              borderRadius: "7px",
              marginBottom: "10px",
              fontSize: "11px",
              lineHeight: "1.3",
              fontWeight: "500",
              background: "#d4edda",
              color: "#155724",
              border: "1px solid #c3e6cb",
            }}
          >
            {success}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "7px" }}
        >
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <label
              htmlFor="name"
              style={{ fontSize: "14px", fontWeight: "600", color: "#2c3e50", margin: "0" }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                padding: "8px 11px",
                fontSize: "13px",
                border: "2px solid #e1e8ed",
                borderRadius: "7px",
                outline: "none",
                fontFamily: "inherit",
                color: "#2c3e50",
                margin: 0,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#c9a86a";
                e.target.style.boxShadow = "0 0 0 3px rgba(201,168,106,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e1e8ed";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <label
              htmlFor="phone"
              style={{ fontSize: "14px", fontWeight: "600", color: "#2c3e50", margin: "0" }}
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{
                padding: "8px 11px",
                fontSize: "13px",
                border: "2px solid #e1e8ed",
                borderRadius: "7px",
                outline: "none",
                fontFamily: "inherit",
                color: "#2c3e50",
                margin: 0,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#c9a86a";
                e.target.style.boxShadow = "0 0 0 3px rgba(201,168,106,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e1e8ed";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "14px", fontWeight: "600", color: "#2c3e50", margin: "0" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                padding: "8px 11px",
                fontSize: "13px",
                border: "2px solid #e1e8ed",
                borderRadius: "7px",
                outline: "none",
                fontFamily: "inherit",
                color: "#2c3e50",
                margin: 0,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#c9a86a";
                e.target.style.boxShadow = "0 0 0 3px rgba(201,168,106,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e1e8ed";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password with eye toggle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "14px", fontWeight: "600", color: "#2c3e50", margin: "0" }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "8px 38px 8px 11px",
                  fontSize: "13px",
                  border: "2px solid #e1e8ed",
                  borderRadius: "7px",
                  outline: "none",
                  fontFamily: "inherit",
                  color: "#2c3e50",
                  boxSizing: "border-box",
                  margin: 0,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#c9a86a";
                  e.target.style.boxShadow = "0 0 0 3px rgba(201,168,106,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e1e8ed";
                  e.target.style.boxShadow = "none";
                }}
              />
              {/* Eye toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: "0",
                  cursor: "pointer",
                  fontSize: "17px",
                  lineHeight: 1,
                  color: "#7f8c8d",
                  display: "flex",
                  alignItems: "center",
                }}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#ffffff",
              background: "linear-gradient(135deg, #c9a86a 0%, #b89968 100%)",
              border: "none",
              borderRadius: "7px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              marginTop: "3px",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 15px rgba(201,168,106,0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <p
            style={{
              marginTop: "8px",
              textAlign: "center",
              fontSize: "15px",
              color: "#7f8c8d",
              marginBottom: "0",
            }}
          >
            Already have an account?{" "}
            <a
              href="/login"
              style={{
                color: "#ff0000",
                textDecoration: "underline",
                fontWeight: "600",
                fontSize: "17px",
              }}
            >
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;