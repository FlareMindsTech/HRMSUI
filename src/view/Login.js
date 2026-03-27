import React, { useState } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 800);
  };

  return (
    <div style={styles.page}>
      {/* Decorative background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Left branding panel */}
        <div style={styles.leftPanel}>
          <div style={styles.logoWrap}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#2DC58A" }}>T</span>
          </div>
          <h2 style={styles.brandTitle}>TeamHub</h2>
          <p style={styles.brandSub}>Human Resource Management System</p>

          <div style={styles.featureList}>
            {["Attendance & Leave Tracking", "Payroll & EPFO Management", "HR Onboarding & MIS Reports"].map((f, i) => (
              <div key={i} style={styles.feature}>
                <span style={styles.featureDot}>✓</span>
                <span style={styles.featureText}>{f}</span>
              </div>
            ))}
          </div>

          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>500+</span>
              <span style={styles.statLabel}>Employees</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>98%</span>
              <span style={styles.statLabel}>Uptime</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>24/7</span>
              <span style={styles.statLabel}>Support</span>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div style={styles.rightPanel}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>Welcome back 👋</h3>
            <p style={styles.formSub}>Sign in to your HRMS account</p>
          </div>

          {error && (
            <div style={styles.alertError}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <FaUser style={styles.inputIcon} />
                <input
                  type="email"
                  style={styles.input}
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <FaLock style={styles.inputIcon} />
                <input
                  type={showPass ? "text" : "password"}
                  style={{ ...styles.input, paddingRight: 40 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  onClick={() => setShowPass(p => !p)}
                >
                  {showPass
                    ? <FaEyeSlash style={{ color: "#8ba49d" }} />
                    : <FaEye style={{ color: "#8ba49d" }} />
                  }
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div style={{ textAlign: "right", marginTop: -4, marginBottom: 20 }}>
              <a href="#" style={styles.forgot}>Forgot password?</a>
            </div>

            {/* Submit */}
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span style={styles.spinner} />
              ) : "Sign In"}
            </button>
          </form>

          <p style={styles.footerNote}>
            © {new Date().getFullYear()} FlareMindsTech · HRMS Platform
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#e8f7f0 0%,#f0f9f4 50%,#e0f4ec 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, position: "relative", overflow: "hidden",
  },

  blob1: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(45,197,138,0.18) 0%,transparent 70%)",
    top: -100, right: -100, pointerEvents: "none",
  },
  blob2: {
    position: "absolute", width: 320, height: 320, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(45,197,138,0.12) 0%,transparent 70%)",
    bottom: -80, left: -80, pointerEvents: "none",
  },

  card: {
    background: "#fff",
    borderRadius: 22,
    boxShadow: "0 20px 60px rgba(0,40,20,0.12), 0 4px 20px rgba(0,40,20,0.06)",
    display: "flex",
    overflow: "hidden",
    width: "100%",
    maxWidth: 820,
    minHeight: 500,
    position: "relative",
    zIndex: 1,
  },

  /* Left branding panel */
  leftPanel: {
    width: 300,
    flexShrink: 0,
    background: "linear-gradient(160deg,#2DC58A 0%,#1a9e6e 60%,#137a54 100%)",
    padding: "36px 28px",
    display: "flex", flexDirection: "column",
    color: "#fff",
  },
  logoWrap: {
    width: 46, height: 46, borderRadius: 13,
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  brandTitle: { fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: "#fff" },
  brandSub: { fontSize: 12.5, opacity: 0.82, margin: "0 0 32px", lineHeight: 1.5 },

  featureList: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 },
  feature: { display: "flex", alignItems: "flex-start", gap: 10 },
  featureDot: {
    width: 20, height: 20, borderRadius: 6,
    background: "rgba(255,255,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
  },
  featureText: { fontSize: 13, opacity: 0.9, lineHeight: 1.4 },

  statsRow: { display: "flex", gap: 12, marginTop: "auto" },
  statBox: {
    flex: 1, background: "rgba(255,255,255,0.15)",
    borderRadius: 10, padding: "10px 8px", textAlign: "center",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  statNum: { display: "block", fontSize: 18, fontWeight: 800, color: "#fff" },
  statLabel: { display: "block", fontSize: 9.5, opacity: 0.75, marginTop: 2 },

  /* Right form panel */
  rightPanel: {
    flex: 1, padding: "40px 36px",
    display: "flex", flexDirection: "column", justifyContent: "center",
  },
  formHeader: { marginBottom: 26 },
  formTitle: { fontSize: 22, fontWeight: 800, color: "#1a2e2a", margin: "0 0 6px" },
  formSub: { fontSize: 13.5, color: "#6b7e77", margin: 0 },

  alertError: {
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#dc2626", borderRadius: 8,
    padding: "9px 14px", fontSize: 13, marginBottom: 16,
  },

  form: { display: "flex", flexDirection: "column" },
  fieldGroup: { marginBottom: 18 },
  label: {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#4a6560", marginBottom: 6, letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  inputWrap: {
    position: "relative",
    display: "flex", alignItems: "center",
  },
  inputIcon: {
    position: "absolute", left: 13,
    color: "#8ba49d", fontSize: 13, pointerEvents: "none",
  },
  input: {
    width: "100%", height: 44,
    paddingLeft: 38, paddingRight: 14,
    border: "1px solid #d5e6de",
    borderRadius: 10,
    background: "#f7fbf9",
    fontSize: 14, color: "#1a2e2a",
    outline: "none", transition: "all 0.2s",
    fontFamily: "inherit",
  },
  eyeBtn: {
    position: "absolute", right: 12,
    background: "transparent", border: "none",
    cursor: "pointer", display: "flex", alignItems: "center",
    fontSize: 14, padding: 2,
  },
  forgot: {
    fontSize: 12.5, color: "#2DC58A",
    textDecoration: "none", fontWeight: 500,
  },
  submitBtn: {
    height: 46,
    background: "linear-gradient(135deg,#2DC58A 0%,#20a673 100%)",
    border: "none", borderRadius: 11,
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 6px 18px rgba(45,197,138,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    letterSpacing: "0.01em",
  },
  spinner: {
    width: 18, height: 18,
    border: "2.5px solid rgba(255,255,255,0.4)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  footerNote: {
    textAlign: "center", fontSize: 11.5,
    color: "#a3bdb5", marginTop: 28, marginBottom: 0,
  },
};

export default Login;