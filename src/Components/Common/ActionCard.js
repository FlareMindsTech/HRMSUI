import React, { forwardRef } from "react";
import "./ActionCard.css";

/**
 * ActionCard — Interactive card for navigation shortcuts & dashboard tiles.
 * Preserves distinct card visual identity without inheriting button styling.
 */
const ActionCard = forwardRef(function ActionCard(
  {
    children,
    title,
    subtitle,
    icon: Icon,
    badge,
    onClick,
    as: Component = "div",
    className = "",
    style,
    ...props
  },
  ref
) {
  const isClickable = Boolean(onClick || props.href || props.to);

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick && onClick(e);
    }
  };

  return (
    <Component
      ref={ref}
      role={isClickable && Component === "div" ? "button" : undefined}
      tabIndex={isClickable && Component === "div" ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`action-card-ui ${isClickable ? "is-clickable" : ""} ${className}`.trim()}
      style={style}
      {...props}
    >
      {Icon && (
        <div className="action-card-icon">
          {typeof Icon === "function" ? <Icon /> : Icon}
        </div>
      )}
      {title && <div className="action-card-title">{title}</div>}
      {subtitle && <p className="action-card-desc">{subtitle}</p>}
      {badge && <div className="action-card-badge">{badge}</div>}
      {children}
    </Component>
  );
});

export { ActionCard };
export default ActionCard;

