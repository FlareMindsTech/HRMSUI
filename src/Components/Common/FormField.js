import React from "react";

/**
 * FormField — Standard form field wrapper with label, error, and helper texts.
 *
 * Rules:
 * - Label (12-13px, 600) above input.
 * - Helper / Error text below (error in red --c-danger).
 * - 16px gap between fields.
 * - Grid helper: 2 columns on desktop (>=768px), 1 column on mobile.
 */
function FormField({
  label,
  required = false,
  helper = null,
  error = null,
  htmlFor,
  className = "",
  children,
}) {
  return (
    <div className={`form-field-ui ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor} className="form-label-ui">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <div className="form-error-ui" role="alert">
          {error}
        </div>
      ) : helper ? (
        <div className="form-helper-ui">
          {helper}
        </div>
      ) : null}
    </div>
  );
}

function FormGrid({ children, columns = 2, className = "", style }) {
  return (
    <div
      className={`form-grid-ui ${className}`.trim()}
      style={columns !== 2 ? { gridTemplateColumns: `repeat(${columns}, 1fr)`, ...style } : style}
    >
      {children}
    </div>
  );
}

FormField.Grid = FormGrid;

export default FormField;
