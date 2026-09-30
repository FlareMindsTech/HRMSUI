import React from "react";
import { Badge } from "react-bootstrap";

/**
 * StatusBadge — shared status → pill mapping.
 *
 * Centralizes the status→variant maps that are otherwise re-invented per
 * file (EmployeeAttachments, Attendance, ProjectManagement, …). It renders
 * the same react-bootstrap `Badge` element the inline helpers render today —
 * only the lookup moves here. Colors, classes, icons, text and fallbacks
 * come from the caller-supplied `map`, so no visual or behavioral change.
 *
 * Presentational only: callers own the status value, filtering and all
 * handlers. Each domain keeps its own `map` (vocabularies are disjoint);
 * there is intentionally no global default map.
 *
 * Entry shape — map[KEY] / defaultEntry:
 *  bg               Badge `bg` (e.g. "success", "success-subtle")
 *  text             Badge `text` prop (e.g. "dark"); omit when unused
 *  className        per-status classes (appended after `className`)
 *  icon             optional react-icons component (e.g. FaCheckCircle)
 *  iconClassName    optional icon classes (e.g. "me-1")
 *  label            fixed label text; when omitted the raw `status` is shown
 *                   (with `fallbackLabel` when status is falsy)
 *
 * Props:
 *  status           status string (required)
 *  map              { KEY: entry } domain vocabulary (required)
 *  normalize        "exact" (default) | "lower" — "lower" matches
 *                   String(status).toLowerCase(), mirroring helpers that
 *                   switch on (status || '').toLowerCase()
 *  defaultEntry     entry used on no match (required — every migrated helper
 *                   has a default branch; preserves e.g. PENDING-on-unknown)
 *  className        classes appended to every badge (e.g. shared pill shape)
 *  fallbackLabel    label when status is falsy and the entry has no `label`
 */
function StatusBadge({
  status,
  map = {},
  normalize = "exact",
  defaultEntry = { bg: "secondary" },
  className = "",
  fallbackLabel = "",
}) {
  const key = normalize === "lower" ? String(status || "").toLowerCase() : status;
  const entry = (map && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null) || defaultEntry || {};
  const label = entry.label !== undefined ? entry.label : status || fallbackLabel;
  const Icon = entry.icon || null;
  const badgeClassName = [className, entry.className].filter(Boolean).join(" ") || undefined;

  return (
    <Badge
      bg={entry.bg}
      text={entry.text}
      className={badgeClassName}
    >
      {Icon ? (
        <>
          <Icon className={entry.iconClassName || undefined} />{" "}
        </>
      ) : null}
      {label}
    </Badge>
  );
}

export default StatusBadge;
