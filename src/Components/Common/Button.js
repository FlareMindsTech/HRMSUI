import React, { forwardRef } from "react";
import { Spinner } from "react-bootstrap";

/**
 * Button — Universal, Accessible Design System Button Component for HRMS.
 *
 * Variants:
 *  - "primary": Branded background, dynamic high-contrast text (Hero/main action)
 *  - "secondary": Clean surface, 1px subtle border, charcoal text (Cancel, Back, Filter)
 *  - "ghost": Transparent, tint hover, brand-colored text (Table row actions, inline links)
 *  - "outline": Transparent with branded border & text (Secondary hero/modals)
 *  - "outline-primary", "outline-secondary", "outline-danger", "outline-success", "outline-dark", "outline-info", "outline-light": React-Bootstrap compatible outlines
 *  - "danger": Outline red (Delete, Reject)
 *  - "danger-filled": Solid filled red (Confirm Delete dialog)
 *  - "icon": Centered square button for icon-only actions
 *  - "success", "warning", "info", "light", "dark", "link": Full Bootstrap semantic compatibility
 *
 * Sizes:
 *  - "sm": 30px compact (tables, toolbars)
 *  - "md": 36px standard (forms, page headers)
 *  - "lg": 44px prominent (hero CTAs, auth, checkout/renewal)
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md", // "sm" | "md" | "lg"
    icon: Icon = null,
    iconPosition = "start", // "start" | "end"
    loading = false,
    loadingText,
    disabled = false,
    type = "button",
    onClick,
    className = "",
    style,
    title,
    ariaLabel,
    fullWidth = false,
    as: Component = null,
    href,
    active = false,
    ...rest
  },
  ref
) {
  // Determine standard variant classes
  const normalizedVariant = (variant || "primary").toString().trim();
  const variantClass = `btn-ui-${normalizedVariant}`;
  const bsVariantClass = `btn-${normalizedVariant}`;

  // Sizing classes
  const sizeClass = size === "sm" ? "btn-ui-sm btn-sm" : size === "lg" ? "btn-ui-lg btn-lg" : "btn-ui-md";
  const loadingClass = loading ? "btn-ui-loading" : "";
  const fullWidthClass = fullWidth ? "w-100" : "";
  const activeClass = active ? "active" : "";

  const classes = [
    "btn",
    "btn-ui",
    bsVariantClass,
    variantClass,
    sizeClass,
    loadingClass,
    fullWidthClass,
    activeClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Polymorphic element resolution
  const Element = Component || (href ? "a" : "button");
  const isNativeButton = Element === "button";

  const renderIcon = () => {
    if (!Icon) return null;
    return typeof Icon === "function" ? <Icon className="btn-ui-icon-svg" /> : Icon;
  };

  return (
    <Element
      ref={ref}
      type={isNativeButton ? type : undefined}
      href={href}
      className={classes}
      disabled={isNativeButton ? disabled || loading : undefined}
      aria-disabled={disabled || loading ? true : undefined}
      onClick={disabled || loading ? (e) => e.preventDefault() : onClick}
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
            className="btn-ui-spinner me-1"
          >
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <span className="btn-ui-label">{loadingText || children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "start" && (
            <span className="btn-ui-icon-wrap btn-ui-icon-start">{renderIcon()}</span>
          )}
          {children && <span className="btn-ui-label">{children}</span>}
          {Icon && iconPosition === "end" && (
            <span className="btn-ui-icon-wrap btn-ui-icon-end">{renderIcon()}</span>
          )}
        </>
      )}
    </Element>
  );
});

export { Button };
export default Button;
