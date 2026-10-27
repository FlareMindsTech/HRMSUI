import React from "react";

/**
 * StatusBadge — shared status pill badge.
 *
 * Rules:
 * - Pill shape (--r-pill), 12px (--fs-small)
 * - 3 status colours only:
 *    success (--c-success)
 *    warning (--c-warning)
 *    danger  (--c-danger)
 *   plus neutral grey (--c-text-2 / --c-bg) and gold tint (--c-gold-tint / --c-gold-dark)
 * - Tokens only (no hex, no !important)
 */
function StatusBadge({
  status,
  map = {},
  normalize = "exact",
  defaultEntry = { variant: "neutral" },
  className = "",
  fallbackLabel = "",
}) {
  const key = normalize === "lower" ? String(status || "").toLowerCase() : status;
  const entry = (map && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null) || defaultEntry || {};
  const label = entry.label !== undefined ? entry.label : status || fallbackLabel;
  const Icon = entry.icon || null;

  // Resolve badge variant: success | warning | danger | gold | neutral
  let variant = entry.variant;
  if (!variant) {
    const bg = String(entry.bg || "").toLowerCase();
    if (bg.includes("success")) variant = "success";
    else if (bg.includes("danger")) variant = "danger";
    else if (bg.includes("warning")) variant = "warning";
    else if (bg.includes("gold") || bg.includes("primary") || bg.includes("info")) variant = "gold";
    else variant = "neutral";
  }

  const badgeClass = [
    "badge-ui",
    `badge-ui-${variant}`,
    className,
    entry.className,
  ].filter(Boolean).join(" ");

  return (
    <span className={badgeClass}>
      {Icon && (
        <Icon className={entry.iconClassName || undefined} />
      )}
      <span>{label}</span>
    </span>
  );
}

export default StatusBadge;
