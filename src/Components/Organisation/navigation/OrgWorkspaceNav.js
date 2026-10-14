import React from "react";

/**
 * One navigation component for BOTH the Organisation workspace and the Branch
 * workspace. It only renders what it is given: callers pass groups that were
 * already permission-filtered (filterNavGroups), so nothing unwanted shows.
 *
 *  - >= 992px : sticky left rail, groups as headings, one row per section.
 *  - <  992px : a single native <select> (works on every phone, keyboard and
 *               screen-reader friendly, no horizontal-scroll tab strips).
 *
 * Styles: ./OrgWorkspaceNav.css (imported by the page that uses the layout).
 */
export default function OrgWorkspaceNav({ groups, activeKey, onSelect, heading, badges }) {
  if (!groups || groups.length === 0) return null;

  return (
    <nav className="ows-nav" aria-label={heading || "Section navigation"}>
      {/* Mobile / tablet */}
      <div className="ows-select-wrap">
        <label className="ows-select-label" htmlFor="ows-section-select">
          {heading || "Section"}
        </label>
        <select
          id="ows-section-select"
          className="ows-select"
          value={activeKey}
          onChange={(e) => onSelect(e.target.value)}
        >
          {groups.map((g) => (
            <optgroup key={g.groupId} label={g.groupTitle}>
              {g.tabs.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Desktop */}
      <div className="ows-rail">
        {heading && <div className="ows-rail-heading">{heading}</div>}
        {groups.map((g) => (
          <div className="ows-group" key={g.groupId}>
            <div className="ows-group-title">{g.groupTitle}</div>
            <ul className="ows-list">
              {g.tabs.map((t) => {
                const Icon = t.icon;
                const isActive = t.key === activeKey;
                const badge = badges ? badges[t.key] : undefined;
                return (
                  <li key={t.key}>
                    <button
                      type="button"
                      className={`ows-item${isActive ? " active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => onSelect(t.key)}
                    >
                      {Icon && <Icon className="ows-item-icon" aria-hidden="true" />}
                      <span className="ows-item-label">{t.label}</span>
                      {t.to && <span className="ows-item-ext" aria-hidden="true">↗</span>}
                      {badge !== undefined && badge !== null && (
                        <span className="ows-item-badge">{badge}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
