import React from "react";
import { Pagination } from "react-bootstrap";

/**
 * PaginationBar — shared presentational pagination control.
 *
 * Rules:
 * - Tokens only (no hex, no !important)
 * - Styled with .pagination-ui for gold active items and token borders
 */
function PaginationBar({
  page,
  totalPages,
  onPageChange,
  size = "sm",
  variant = "full",
  showEllipsis = false,
  ellipsisKeyPrefix = "",
  prevLabel = "Previous",
  nextLabel = "Next",
  info = null,
  wrapperClassName = "d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3",
  paginationClassName = "mb-0",
}) {
  const current = Number(page) || 1;
  const total = Math.max(Number(totalPages) || 0, 0);

  const goTo = (pg) => {
    if (onPageChange) onPageChange(pg);
  };

  const renderItems = () => {
    const pages = [...Array(total).keys()].map((n) => n + 1);
    if (!showEllipsis) {
      return pages.map((pg) => (
        <Pagination.Item key={pg} active={pg === current} onClick={() => goTo(pg)}>
          {pg}
        </Pagination.Item>
      ));
    }
    const prefix = ellipsisKeyPrefix ? `ell-${ellipsisKeyPrefix}-` : "ell-";
    return pages.map((pg) => {
      if (total > 7) {
        if (pg !== 1 && pg !== total && Math.abs(pg - current) > 2) {
          if (pg === 2 || pg === total - 1) {
            return <Pagination.Ellipsis key={`${prefix}${pg}`} disabled />;
          }
          return null;
        }
      }
      return (
        <Pagination.Item key={pg} active={pg === current} onClick={() => goTo(pg)}>
          {pg}
        </Pagination.Item>
      );
    });
  };

  const paginationClasses = ["pagination-ui", paginationClassName].filter(Boolean).join(" ");

  return (
    <div className={wrapperClassName}>
      {info ? <div className="text-muted small">{info}</div> : <div />}
      <Pagination size={size} className={paginationClasses}>
        <Pagination.Prev disabled={current <= 1} onClick={() => goTo(Math.max(1, current - 1))}>
          {prevLabel}
        </Pagination.Prev>
        {variant !== "prev-next" ? renderItems() : null}
        <Pagination.Next
          disabled={current >= total}
          onClick={() => goTo(Math.min(total, current + 1))}
        >
          {nextLabel}
        </Pagination.Next>
      </Pagination>
    </div>
  );
}

export default PaginationBar;
