import React from "react";

/**
 * Card — Standard content card for forms, tables, and dashboards.
 *
 * Rules:
 * - White bg (--c-card), 1px border (--c-border), radius 12 (--r-md), padding 16-24 (--s-4 to --s-5).
 * - Optional Card Header: title (16px/600) on left, actions on right, bottom border.
 * - Table scrolling stays inside the Card only.
 */
function Card({
  title,
  subtitle,
  actions = null,
  footer = null,
  children,
  className = "",
  size = "md", // "sm" | "md"
  style,
  noPadding = false,
}) {
  const cardClassName = [
    "card-ui",
    size === "sm" ? "card-ui-sm" : "",
    noPadding ? "p-0" : "",
    className,
  ].filter(Boolean).join(" ");

  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <div className={cardClassName} style={style}>
      {hasHeader && (
        <div className="card-ui-header">
          <div className="d-flex flex-column">
            {title && <h2 className="card-ui-title">{title}</h2>}
            {subtitle && <p className="card-ui-subtitle mb-0">{subtitle}</p>}
          </div>
          {actions && <div className="card-ui-actions">{actions}</div>}
        </div>
      )}
      <div className="card-ui-body">
        {children}
      </div>
      {footer && (
        <div className="card-ui-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

function CardHeader({ title, subtitle, actions, children, className = "" }) {
  return (
    <div className={`card-ui-header ${className}`.trim()}>
      <div className="d-flex flex-column">
        {title && <h2 className="card-ui-title">{title}</h2>}
        {subtitle && <p className="card-ui-subtitle mb-0">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="card-ui-actions">{actions}</div>}
    </div>
  );
}

function CardBody({ children, className = "", style }) {
  return (
    <div className={`card-ui-body ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

function CardFooter({ children, className = "" }) {
  return (
    <div className={`card-ui-footer ${className}`.trim()}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
