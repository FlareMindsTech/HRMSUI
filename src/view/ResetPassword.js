import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../services/passwordResetService";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetToken.trim()) {
      setError("Reset token is required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        resetToken: resetToken.trim(),
        newPassword,
      });
      setSuccess(res?.message || "Password has been reset successfully.");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">
          Enter the one-time reset token provided to you and your new password.
        </p>
        {error && <div className="auth-error-msg">{error}</div>}
        {success && <div className="auth-success-msg">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Reset Token</label>
            <input
              type="text"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="auth-field">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <button
          type="button"
          className="auth-mode-link"
          onClick={() => navigate("/login")}
        >
          Back to login
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;