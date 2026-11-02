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
 * FeedbackAlert — the single app-wide notification banner & floating toast.
 *
 * Used by every dashboard page and org section for success/error/warning
 * feedback (same props everywhere, unified enterprise design). Renders null
 * when `message` is falsy, preserving the existing `{x && <Alert …>}` gating.
 *
 * Props:
 *  variant       "success" | "danger" | "error" | "warning" | "info" (default "info")
 *  message       string or React node (auto-extracts message from Error/objects)
 *  title         optional header text for alert
 *  dismissible   show the close button (default false, auto-true if floating)
 *  onClose       close handler
 *  autoDismissMs optional ms after which onClose fires automatically
 *  floating      render as a sleek, fixed floating toast (top-right, no layout shift)
 *  className     extra classes passthrough
 */
const VARIANT_ICON = {
  success: FaCheckCircle,
  danger: FaExclamationCircle,
  error: FaExclamationCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

function FeedbackAlert({
  variant = "info",
  message,
  title,
  dismissible = false,
  onClose,
  autoDismissMs,
  floating = false,
  className = "",
}) {
  let safeVariant = String(variant || "info").toLowerCase();
  if (safeVariant === "error") safeVariant = "danger";
  const kind = Object.prototype.hasOwnProperty.call(VARIANT_ICON, safeVariant)
    ? safeVariant
    : "info";
  const Icon = VARIANT_ICON[kind];

  const effectiveAutoDismiss =
    autoDismissMs !== undefined
      ? autoDismissMs
      : floating || kind === "success"
      ? 4500
      : undefined;

  useEffect(() => {
    if (!message || !effectiveAutoDismiss || typeof onClose !== "function") return undefined;
    const timer = setTimeout(onClose, effectiveAutoDismiss);
    return () => clearTimeout(timer);
  }, [message, effectiveAutoDismiss, onClose]);

  if (!message) return null;

  let displayMessage = message;
  if (
    displayMessage &&
    typeof displayMessage === "object" &&
    !React.isValidElement(displayMessage)
  ) {
    displayMessage =
      displayMessage.message ||
      displayMessage.error ||
      displayMessage.detail ||
      String(displayMessage);
  }

  const containerClasses = [
    "app-notify",
    `app-notify-${kind}`,
    floating ? "app-notify-floating" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses} role="alert" aria-live="polite">
      <span className="app-notify-icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="app-notify-body">
        {title && <span className="app-notify-title">{title}</span>}
        <span className="app-notify-message">{displayMessage}</span>
      </div>
      {(dismissible || floating) && typeof onClose === "function" && (
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