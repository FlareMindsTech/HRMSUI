import React from "react";
import { Spinner } from "react-bootstrap";

/**
 * LoadingSpinner — shared wrapper around react-bootstrap `Spinner`.
 *
 * Mirrors the four loading contexts already used across the app so call sites
 * render byte-identical markup to the inline spinners they replace:
 *  - "page":   centered block (`div.text-center.py-5`) with optional caption
 *  - "table":  table loading row (`tr > td.text-center.py-4` with colSpan)
 *  - "inline": bare spinner (caller keeps surrounding text/layout)
 *  - "button": bare small spinner (caller keeps the loading ternary/icon)
 *
 * `animation` is always "border" — no "grow" spinner exists in the codebase.
 *
 * Props:
 *  variant            "inline" (default) | "page" | "table" | "button"
 *  color              react-bootstrap variant (success, warning, info, ...)
 *  size               "sm" | undefined (react-bootstrap sizes)
 *  style              inline style passthrough (e.g. { width: 40, height: 40 })
 *  className          extra classes passthrough (e.g. "me-1 spinner-mini")
 *  message            caption text for the "page" variant (exact copy per site)
 *  messageAs          caption element for "page" (default "p")
 *  messageClassName   caption classes for "page" (default "text-muted small mt-2")
 *  colSpan            <td> span for the "table" variant (default 5)
 */
function LoadingSpinner({
  variant = "inline",
  color,
  size,
  style,
  className = "",
  message = null,
  messageAs: MessageAs = "p",
  messageClassName = "text-muted small mt-2",
  colSpan = 5,
}) {
  const spinner = (
    <Spinner
      animation="border"
      variant={color}
      size={size}
      style={style}
      className={className || undefined}
    />
  );

  if (variant === "table") {
    return (
      <tr>
        <td colSpan={colSpan} className="text-center py-4">
          {spinner}
        </td>
      </tr>
    );
  }

  if (variant === "page") {
    return (
      <div className="text-center py-5">
        {spinner}
        {message ? <MessageAs className={messageClassName}>{message}</MessageAs> : null}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
