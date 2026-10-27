import React from "react";
import Button from "./Button";

/**
 * EmptyState — shared empty-content placeholder.
 *
 * Rules:
 * - Centred, icon in gold-tint chip + 1 line + optional button
 * - Tokens only (no hex, no inline styles, no !important)
 * - Standard button (no generic outline-success)
 */
function EmptyState({
  title,
  description = null,
  descriptionClassName = "text-muted small mb-3",
  icon: Icon = null,
  iconSize = 24,
  iconClassName = "",
  titleAs: TitleAs = "p",
  titleClassName = "fw-semibold mb-1 text-dark",
  actionLabel,
  onAction,
  actionVariant = "primary",
  actionSize = "sm",
  actionClassName = "",
  actionIcon = null,
  bodyClassName = "py-4",
  className = "text-center text-muted",
  variant = "block",
  colSpan = 5,
}) {
  const isBare = !Icon && !description && !(actionLabel && onAction);

  const content = isBare ? (
    <span className="text-muted small">{title}</span>
  ) : (
    <div className="d-flex flex-column align-items-center justify-content-center text-center">
      {Icon ? (
        <div className={`empty-state-icon-box ${iconClassName}`.trim()}>
          <Icon size={iconSize} />
        </div>
      ) : null}
      <TitleAs className={titleClassName}>{title}</TitleAs>
      {description ? <p className={descriptionClassName}>{description}</p> : null}
      {actionLabel && onAction ? (
        <Button
          variant={actionVariant}
          size={actionSize}
          className={actionClassName}
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );

  const wrapped =
    bodyClassName && !isBare ? <div className={bodyClassName}>{content}</div> : content;

  if (variant === "table") {
    return (
      <tr>
        <td colSpan={colSpan} className={className}>
          {wrapped}
        </td>
      </tr>
    );
  }

  return <div className={className}>{wrapped}</div>;
}

export default EmptyState;
