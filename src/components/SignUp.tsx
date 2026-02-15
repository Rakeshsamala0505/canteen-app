import { useState } from "react";
import type { SignUpData } from "../services/authService";
import { supabase } from "../lib/supabase";

const SignUp = () => {
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
      // 🔍 Check if user already exists in users table
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
        const isDuplicate = msg.includes("already") || msg.includes("user already") || msg.includes("duplicate");
        if (isDuplicate) {
          setDuplicateEmail(true);
          setError("");
          setSuccess("");
          setLoading(false);
          return;
        }
        throw authError;
      }

      if (authData?.user) {
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            is_admin: false,
          },
        ]);
        if (profileError) console.warn("Profile create warning:", profileError.message);
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

  const styles = {
    container: {
  minHeight: "88vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
  padding: "16px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
},
    card: {
      background: "#ffffff",
      borderRadius: "14px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
      padding: "20px 26px 18px",
      width: "100%",
      maxWidth: "420px",
    },
    header: {
      textAlign: "center" as const,
      marginBottom: "12px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#2c3e50",
      margin: "0 0 2px 0",
      letterSpacing: "-0.5px",
    },
    subtitle: {
      fontSize: "17px",
      color: "#7f8c8d",
      fontWeight: "400",
      margin: "0",
    },
    notice: {
      padding: "7px 11px",
      borderRadius: "7px",
      marginBottom: "10px",
      fontSize: "11px",
      lineHeight: "1.3",
      fontWeight: "500",
    },
    noticeError: {
      background: "#fee",
      color: "#c33",
      border: "1px solid #fcc",
    },
    noticeSuccess: {
      background: "#d4edda",
      color: "#155724",
      border: "1px solid #c3e6cb",
    },
    form: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "7px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "3px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#2c3e50",
      letterSpacing: "0.2px",
      margin: "0",
    },
    input: {
      padding: "8px 11px",
      fontSize: "13px",
      border: "2px solid #e1e8ed",
      borderRadius: "7px",
      outline: "none",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
      color: "#2c3e50",
    },
    button: {
      padding: "9px 16px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#ffffff",
      background: "linear-gradient(135deg, #c9a86a 0%, #b89968 100%)",
      border: "none",
      borderRadius: "7px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginTop: "3px",
      letterSpacing: "0.5px",
      boxShadow: "0 4px 15px rgba(201, 168, 106, 0.3)",
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
      transform: "none",
    },
    footer: {
      marginTop: "8px",
      textAlign: "center" as const,
      fontSize: "15px",
      color: "#7f8c8d",
      marginBottom: "0",
    },
    link: {
      color: "#ff0000",
      textDecoration: "underline",
      fontWeight: "600",
      transition: "color 0.2s ease",
      fontSize: "17px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join IIMR Canteen today</p>
        </div>

        {duplicateEmail && (
          <div style={{ ...styles.notice, ...styles.noticeError }}>
            This email is already registered. Please <a href="/login" style={styles.link}>log in</a> or <a href="/forgot-password" style={styles.link}>reset your password</a>.
          </div>
        )}
        {error && <div style={{ ...styles.notice, ...styles.noticeError }}>{error}</div>}
        {success && <div style={{ ...styles.notice, ...styles.noticeSuccess }}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="name" style={styles.label}>Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
              onFocus={(e) => e.target.style.cssText = `${e.target.style.cssText}; border-color: #c9a86a; box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.1);`}
              onBlur={(e) => e.target.style.cssText = `${e.target.style.cssText}; border-color: #e1e8ed; box-shadow: none;`}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="phone" style={styles.label}>Phone Number</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={styles.input}
              onFocus={(e) => e.target.style.cssText = `${e.target.style.cssText}; border-color: #c9a86a; box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.1);`}
              onBlur={(e) => e.target.style.cssText = `${e.target.style.cssText}; border-color: #e1e8ed; box-shadow: none;`}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              onFocus={(e) => e.target.style.cssText = `${e.target.style.cssText}; border-color: #c9a86a; box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.1);`}
              onBlur={(e) => e.target.style.cssText = `${e.target.style.cssText}; border-color: #e1e8ed; box-shadow: none;`}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
              onFocus={(e) => e.target.style.cssText = `${e.target.style.cssText}; border-color: #c9a86a; box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.1);`}
              onBlur={(e) => e.target.style.cssText = `${e.target.style.cssText}; border-color: #e1e8ed; box-shadow: none;`}
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <p style={styles.footer}>
            Already have an account?{" "}
            <a href="/login" style={styles.link}>
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;