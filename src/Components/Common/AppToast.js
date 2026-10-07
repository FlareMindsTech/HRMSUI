import React, { useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import "./AppToast.css";

/**
 * AppToast — floating popup notification for transient page-level feedback
 * (e.g. "Custom role created successfully", "Account settings updated").
 *
 * Unlike the inline FeedbackAlert banner, this floats above the page
 * (top-right, slides in) and dismisses itself, so success confirmations
 * never push layout around. Controlled: callers own the message state.
 *
 * Props:
 *  toast           { variant, message } or null (renders nothing when null)
 *  onClose         dismiss handler (auto-dismiss + close button)
 *  autoDismissMs   ms before auto-dismiss (default 4000; 0 disables)
 */
const VARIANT_ICON = {
  success: FaCheckCircle,
  danger: FaExclamationCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

function AppToast({ toast, onClose, autoDismissMs = 4000 }) {
  const message = toast?.message || null;
  const variant = Object.prototype.hasOwnProperty.call(VARIANT_ICON, toast?.variant)
    ? toast.variant
    : "info";

  useEffect(() => {
    if (!message || !autoDismissMs || typeof onClose !== "function") return undefined;
    const timer = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, variant, autoDismissMs, onClose]);

  if (!message) return null;
  const Icon = VARIANT_ICON[variant];

  return (
    <div className={`app-toast app-toast-${variant}`} role="status" aria-live="polite">
      <span className="app-toast-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="app-toast-body">{message}</span>
      <button
        type="button"
        className="app-toast-close"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        <FaTimes />
      </button>
    </div>
  );
}

export default AppToast;
