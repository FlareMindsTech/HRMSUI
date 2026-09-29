import React from "react";
import { Table } from "react-bootstrap";

/**
 * DataTable — shared table shell for the standard list tables used across
 * the app (org-section CRUD tables, dashboard list tables).
 *
 * Renders a react-bootstrap `Table` with generated header, uniform body rows,
 * and caller-supplied loading / empty elements in the exact branch positions
 * the inline tables use today:
 *   loading ? loadingComponent : rows empty ? emptyComponent : rows
 *
 * Pass the existing `LoadingSpinner variant="table"` / `EmptyState
 * variant="table"` elements (or the original inline <tr> markup) as
 * loadingComponent / emptyComponent — DataTable never duplicates them.
 * Column `render(row, rowIndex)` closures absorb badges, multi-line cells
 * and permission-gated action cells without moving any business logic.
 * Pagination stays OUTSIDE as a sibling, as every caller does today.
 *
 * Props (all optional):
 *  columns       [{ key, header, headerClassName, cellClassName,
 *                   render(row, rowIndex) }] — header text + per-cell render.
 *                 Without `render`, the raw `row[col.key]` value is shown.
 *  rows          data array (default [])
 *  rowKey        (row, index) => key (default row._id || row.id || index)
 *  loading       bool (default false)
 *  loadingComponent element rendered in <tbody> while loading (default null)
 *  emptyComponent   element rendered in <tbody> when rows is empty (default null)
 *  hover, responsive, size, bordered, striped — Table flags passthrough
 *  className     Table classes, e.g. "org-table mb-0 align-middle" (default "")
 *  style         Table style passthrough
 *  headerRowClassName optional <tr> classes inside <thead> (default "")
 *  bodyClassName optional <tbody> classes (default "")
 */
function DataTable({
  columns = [],
  rows = [],
  rowKey = (row, index) => row._id || row.id || index,
  loading = false,
  loadingComponent = null,
  emptyComponent = null,
  hover,
  responsive,
  size,
  bordered,
  striped,
  className = "",
  style,
  headerRowClassName = "",
  bodyClassName = "",
}) {
  return (
    <Table
      hover={hover}
      responsive={responsive}
      size={size}
      bordered={bordered}
      striped={striped}
      className={className || undefined}
      style={style}
    >
      <thead>
        <tr className={headerRowClassName || undefined}>
          {columns.map((col) => (
            <th key={col.key} className={col.headerClassName}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={bodyClassName || undefined}>
        {loading
          ? loadingComponent
          : rows.length === 0
            ? emptyComponent
            : rows.map((row, rowIndex) => (
                <tr key={rowKey(row, rowIndex)}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.cellClassName}>
                      {col.render ? col.render(row, rowIndex) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
      </tbody>
    </Table>
  );
}

export default DataTable;
