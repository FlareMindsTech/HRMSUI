import React, { useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import "./FeedbackAlert.css";

/**
 * FeedbackAlert — the single app-wide notification banner.
 *
 * Used by every dashboard page and org section for success/error/warning
 * feedback (same props everywhere, one themed design). Renders null when
 * `message` is falsy, preserving the existing `{x && <Alert …>}` gating.
 *
 * Props (variant + message required; rest optional):
 *  variant       "success" | "danger" | "warning" | "info" (unknown → info)
 *  message       string or node (exact copy per site)
 *  dismissible   show the close button (default false)
 *  onClose       close handler (wired only when `dismissible` is true)
 *  autoDismissMs optional ms after which onClose fires automatically
 *                (opt-in; existing callers without onClose are unaffected)
 *  className     extra classes passthrough
 */
const VARIANT_ICON = {
  success: FaCheckCircle,
  danger: FaExclamationCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

function FeedbackAlert({
  variant,
  message,
  dismissible = false,
  onClose,
  autoDismissMs,
  className,
}) {
  useEffect(() => {
    if (!message || !autoDismissMs || typeof onClose !== "function") return undefined;
    const timer = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, autoDismissMs, onClose]);

  if (!message) return null;
  const kind = Object.prototype.hasOwnProperty.call(VARIANT_ICON, variant) ? variant : "info";
  const Icon = VARIANT_ICON[kind];

  return (
    <div className={`app-notify app-notify-${kind}${className ? ` ${className}` : ""}`} role="alert">
      <span className="app-notify-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="app-notify-body">{message}</span>
      {dismissible && (
        <button
          type="button"
          className="app-notify-close"
          aria-label="Dismiss notification"
          onClick={onClose}
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
}

export default FeedbackAlert;
