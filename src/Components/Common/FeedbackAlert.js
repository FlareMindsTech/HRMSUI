import React from "react";
import { Alert } from "react-bootstrap";

/**
 * FeedbackAlert — shared success/error alert rendering.
 *
 * Mirrors the page-level `{error,success + dismissible Alert}` pair and the
 * static modal `{modalError && <Alert>}` slot used across org sections and
 * dashboard pages, so call sites render byte-identical markup to the inline
 * alerts they replace.
 *
 * Presentational only. Message state, auto-dismiss timers (e.g. the
 * `setTimeout(() => setSuccess(""), 4000)` calls in save/delete handlers),
 * validation and all handlers stay with the caller — this component only
 * renders. Renders null when `message` is falsy, preserving the existing
 * `{x && <Alert …>}` gating at each site.
 *
 * Props (variant + message required; rest optional):
 *  variant       Alert variant ("danger" | "success" | "warning" | …)
 *  message       string or node (exact copy per site)
 *  dismissible   show the close button (default false — page-level alerts
 *                pass it explicitly, modal error slots omit it)
 *  onClose       close handler (wired only when `dismissible` is true)
 *  className     extra classes passthrough (most sites have none)
 */
function FeedbackAlert({
  variant,
  message,
  dismissible = false,
  onClose,
  className,
}) {
  if (!message) return null;
  return (
    <Alert
      variant={variant}
      dismissible={dismissible}
      onClose={dismissible ? onClose : undefined}
      className={className || undefined}
    >
      {message}
    </Alert>
  );
}

export default FeedbackAlert;
