import React from "react";
import { Pagination } from "react-bootstrap";

/**
 * PaginationBar — shared presentational pagination control.
 *
 * Mirrors the pagination markup already used across the app:
 *  - variant "full" (default): Prev + page items + Next
 *  - variant "prev-next": Prev + Next only, no page items
 *  - showEllipsis: the V-B window algorithm (first/last pinned, ±2 around
 *    current, ellipsis at the 2nd / second-to-last positions)
 *
 * Presentational only. Callers own page state, setPage logic, the
 * `{totalPages > 1 && ...}` gate, page-size/totalRecords math, info text,
 * fetching and filtering. `info` accepts a caller-computed ReactNode that is
 * rendered exactly where the caller places this component's output.
 *
 * Props (page, totalPages, onPageChange required; rest optional):
 *  page, totalPages      current page + page count (numbers)
 *  onPageChange          (pg) => void — Prev/Next clamp to [1, totalPages],
 *                        matching every caller's existing handlers
 *  size                  Pagination size passthrough (all sites use "sm")
 *  variant               "full" (default) | "prev-next"
 *  showEllipsis          V-B ellipsis window (default false)
 *  ellipsisKeyPrefix     key prefix, e.g. "u" renders ell-u-5 (default "")
 *  prevLabel / nextLabel button labels; omitted = icon-only Prev/Next
 *  info                  optional ReactNode rendered before the control
 *                        (e.g. "Showing X–Y of Z records")
 *  wrapperClassName      outer div classes passthrough
 *  paginationClassName   Pagination classes passthrough (e.g. "mb-0")
 */
function PaginationBar({
  page,
  totalPages,
  onPageChange,
  size,
  variant = "full",
  showEllipsis = false,
  ellipsisKeyPrefix = "",
  prevLabel = "",
  nextLabel = "",
  info = null,
  wrapperClassName = "",
  paginationClassName = "",
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

  return (
    <div className={wrapperClassName || undefined}>
      {info}
      <Pagination size={size} className={paginationClassName || undefined}>
        <Pagination.Prev disabled={current <= 1} onClick={() => goTo(Math.max(1, current - 1))}>
          {prevLabel || null}
        </Pagination.Prev>
        {variant !== "prev-next" ? renderItems() : null}
        <Pagination.Next
          disabled={current >= total}
          onClick={() => goTo(Math.min(total, current + 1))}
        >
          {nextLabel || null}
        </Pagination.Next>
      </Pagination>
    </div>
  );
}

export default PaginationBar;
