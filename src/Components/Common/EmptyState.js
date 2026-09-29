import React from "react";
import { Button } from "react-bootstrap";

/**
 * EmptyState — shared empty-content placeholder.
 *
 * Mirrors the empty-state markup already used across the app so call sites
 * render byte-identical output to the inline JSX they replace:
 *  - "block": centered container div (cards, panels, sections)
 *  - "table": table empty row (tr > td with colSpan)
 *
 * When only `title` is given it renders as a raw text node (matching the
 * plain `td`/`div` rows used by most tables). When icon/description/action
 * are given it renders the structured icon + title + description + button
 * composition used by the richer card/row variants.
 *
 * Callers own ALL conditions, filtering, permission gates, state and
 * handlers — this component only renders. A permission-gated action stays
 * gated at the call site, e.g.:
 *   actionLabel={canCreate ? "Add First Team" : undefined}
 *
 * Props (only `title` is required):
 *  title                message text (exact copy per site)
 *  description          optional supporting text (string; caller may pass a
 *                       conditional expression — logic stays with the caller)
 *  descriptionClassName optional description classes (default "text-muted small")
 *  icon                 optional react-icons component (e.g. FaUsers)
 *  iconSize             optional icon size (default: icon library default)
 *  iconClassName        optional icon classes
 *  titleAs              title element when structured (default "p")
 *  titleClassName       optional title classes (default "")
 *  actionLabel          optional button label (button renders only with onAction)
 *  onAction             optional button handler (stays owned by the caller)
 *  actionVariant        Button variant (default "outline-success")
 *  actionSize           Button size (default "sm")
 *  actionClassName      optional extra Button classes (default "")
 *  actionIcon           optional element rendered before the label
 *  bodyClassName        optional inner wrapper div classes (e.g. "p-3")
 *  className            outer container classes — the td in "table" mode,
 *                       the div in "block" mode (default "text-center text-muted")
 *  variant              "block" (default) | "table"
 *  colSpan              <td> span for the "table" variant (default 5)
 */
function EmptyState({
  title,
  description = null,
  descriptionClassName = "text-muted small",
  icon: Icon = null,
  iconSize,
  iconClassName = "",
  titleAs: TitleAs = "p",
  titleClassName = "",
  actionLabel,
  onAction,
  actionVariant = "outline-success",
  actionSize = "sm",
  actionClassName = "",
  actionIcon = null,
  bodyClassName = "",
  className = "text-center text-muted",
  variant = "block",
  colSpan = 5,
}) {
  const isBare = !Icon && !description && !(actionLabel && onAction);

  const content = isBare ? (
    title
  ) : (
    <>
      {Icon ? <Icon size={iconSize} className={iconClassName || undefined} /> : null}
      <TitleAs className={titleClassName || undefined}>{title}</TitleAs>
      {description ? <p className={descriptionClassName}>{description}</p> : null}
      {actionLabel && onAction ? (
        <Button
          variant={actionVariant}
          size={actionSize}
          className={actionClassName || undefined}
          onClick={onAction}
        >
          {actionIcon}
          {actionLabel}
        </Button>
      ) : null}
    </>
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
