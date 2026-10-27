import React from "react";
import { Spinner } from "react-bootstrap";

/**
 * LoadingSpinner — shared wrapper around react-bootstrap `Spinner`.
 *
 * Rules:
 * - Tokens only (no hex, no inline styles, no !important)
 * - Gold spinner border by default (.spinner-ui)
 * - Centered, icon/spinner + 1 line caption
 */
function LoadingSpinner({
  variant = "inline",
  color,
  size,
  style,
  className = "",
  message = null,
  messageAs: MessageAs = "p",
  messageClassName = "text-muted small mt-2 mb-0",
  colSpan = 5,
}) {
  const spinnerClasses = [
    !color ? "spinner-ui" : "",
    className,
  ].filter(Boolean).join(" ");

  const spinner = (
    <Spinner
      animation="border"
      variant={color}
      size={size}
      style={style}
      className={spinnerClasses || undefined}
    />
  );

  if (variant === "table") {
    return (
      <tr>
        <td colSpan={colSpan} className="text-center py-4">
          <div className="d-flex flex-column align-items-center justify-content-center">
            {spinner}
            {message ? <MessageAs className={messageClassName}>{message}</MessageAs> : null}
          </div>
        </td>
      </tr>
    );
  }

  if (variant === "page") {
    return (
      <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center">
        {spinner}
        {message ? <MessageAs className={messageClassName}>{message}</MessageAs> : null}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
