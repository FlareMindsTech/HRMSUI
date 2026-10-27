import React from "react";

/**
 * PageShell — Root layout container for every page view.
 *
 * Rules:
 * - Max-width 1440px, centered.
 * - No extra padding (Layout shell already provides padding).
 * - Replaces custom page wrappers (*-page, *-container, min-vh-100, bg-light).
 */
function PageShell({
  children,
  className = "",
  style,
  maxWidth = 1440,
}) {
  const customStyle = {
    maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
    ...style,
  };

  return (
    <div className={`page-shell ${className}`.trim()} style={customStyle}>
      {children}
    </div>
  );
}

export default PageShell;
