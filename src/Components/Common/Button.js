import React from "react";
import { Spinner } from "react-bootstrap";

/**
 * Button — Standard application button component.
 *
 * Variants:
 *  - "primary": Gold background, charcoal text (Main action, only 1 per view/modal)
 *  - "secondary": White background, 1px border, charcoal text (Cancel, Back, Filter)
 *  - "dark": Charcoal background, white text (Hero/section CTA)
 *  - "ghost": Transparent, gold-dark text, tint hover (Table row actions, links)
 *  - "danger": Outline red (Delete, Reject)
 *  - "danger-filled": Filled red (Confirm Delete modal)
 *  - "icon": Square 36x36 (or 30x30 sm) button for icon-only actions
 */
function Button({
  children,
  variant = "primary",
  size = "md", // "sm" | "md"
  icon: Icon = null,
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  style,
  title,
  ariaLabel,
  ...rest
}) {
  const variantClass = `btn-ui-${variant}`;
  const sizeClass = size === "sm" ? "btn-ui-sm" : "";
  const loadingClass = loading ? "btn-ui-loading" : "";

  const classes = [
    "btn-ui",
    variantClass,
    sizeClass,
    loadingClass,
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      title={title}
      aria-label={ariaLabel || title}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-1"
          />
          {children}
        </>
      ) : (
        <>
          {Icon && (typeof Icon === "function" ? <Icon /> : Icon)}
          {children}
        </>
      )}
    </button>
  );
}

export default Button;
