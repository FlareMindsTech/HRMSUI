import React from "react";

/**
 * Toolbar — Single row under PageHeader for search, filters, and auxiliary actions.
 *
 * Rules:
 * - Search on left -> Filters in middle -> Primary action / export on right.
 * - Stacks vertically on small screens (<768px).
 */
function Toolbar({
  search = null,
  filters = null,
  actions = null,
  className = "",
  children,
}) {
  return (
    <div className={`toolbar-ui ${className}`.trim()}>
      {(search || filters) && (
        <div className="toolbar-left">
          {search && <div className="toolbar-search">{search}</div>}
          {filters && <div className="toolbar-filters">{filters}</div>}
        </div>
      )}
      {children}
      {actions && <div className="toolbar-actions">{actions}</div>}
    </div>
  );
}

export default Toolbar;
