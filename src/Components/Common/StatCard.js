import React from "react";

/**
 * StatCard — Metric statistic card.
 *
 * Rules:
 * - Number 24px/700 Charcoal.
 * - Label 12px grey (--c-text-2) uppercase.
 * - Icon chip gold-tint (--c-gold-tint) with gold-dark icon.
 * - Grid layout helper: 4 cols >=1200px, 2 cols >=576px, 1 col below.
 */
function StatCard({
  value,
  label,
  icon: Icon = null,
  trend = null,
  className = "",
  style,
  onClick,
}) {
  return (
    <div
      className={`stat-card-ui ${className}`.trim()}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-card-info">
        <div className="stat-card-num">{value}</div>
        <div className="stat-card-label">{label}</div>
        {trend && <div className="stat-card-trend mt-1">{trend}</div>}
      </div>
      {Icon && (
        <div className="stat-card-icon">
          {typeof Icon === "function" ? <Icon /> : Icon}
        </div>
      )}
    </div>
  );
}

function StatCardGrid({ children, className = "", style }) {
  return (
    <div className={`stat-card-grid ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

StatCard.Grid = StatCardGrid;

export default StatCard;
