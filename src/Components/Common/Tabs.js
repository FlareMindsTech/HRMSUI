import React from "react";

/**
 * Tabs — Standard text tab strip with gold underline for active state.
 *
 * Rules:
 * - Text tabs with 2px gold underline on active.
 * - No pill tabs, no rainbow colored tabs.
 */
function Tabs({
  tabs = [], // [{ key, label, count, icon }]
  activeTab,
  onChange,
  className = "",
  style,
}) {
  return (
    <div className={`tabs-ui ${className}`.trim()} role="tablist" style={style}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab-ui-btn ${isActive ? "active" : ""}`}
            onClick={() => onChange && onChange(tab.key)}
          >
            {Icon && (typeof Icon === "function" ? <Icon /> : Icon)}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span className={`badge-ui ${isActive ? "badge-ui-gold" : "badge-ui-neutral"}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
