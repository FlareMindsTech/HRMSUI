import React from "react";

/**
 * PageHeader — Uniform header row for all application pages.
 *
 * Rules:
 * - Title (22px, bold, Charcoal) + optional subtitle (14px, grey) on the left.
 * - Action buttons on the right.
 * - Wraps below 768px.
 * - Maximum 1 primary button per header.
 */
function PageHeader({
  title,
  subtitle,
  actions = null,
  badge = null,
  className = "",
  children,
}) {
  return (
    <header className={`page-header-ui ${className}`.trim()}>
      <div className="page-header-left">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {title && <h1 className="page-header-title">{title}</h1>}
          {badge}
        </div>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="page-header-actions">
          {actions}
          {children}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
