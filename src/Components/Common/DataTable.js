import React from "react";
import { Table } from "react-bootstrap";

/**
 * DataTable — shared table shell for the standard list tables used across the app.
 *
 * Rules:
 * - Header row bg --c-bg, 12px uppercase grey header text (--c-text-2)
 * - Row height 48px, hover tint (--c-gold-tint)
 * - Actions column right-aligned, numbers right-aligned, text left-aligned
 * - Wrap in overflow-x:auto inside the card only (.table-ui-container)
 * - Tokens only (no hex, no !important)
 */
function DataTable({
  columns = [],
  rows = [],
  rowKey = (row, index) => row._id || row.id || index,
  loading = false,
  loadingComponent = null,
  emptyComponent = null,
  hover = true,
  responsive = false,
  size,
  bordered = false,
  striped = false,
  className = "",
  style,
  headerRowClassName = "",
  bodyClassName = "",
}) {
  const tableClassName = ["table-ui", "align-middle", className].filter(Boolean).join(" ");

  return (
    <div className="table-ui-container">
      <Table
        hover={hover}
        responsive={responsive}
        size={size}
        bordered={bordered}
        striped={striped}
        className={tableClassName}
        style={style}
      >
        <thead>
          <tr className={headerRowClassName || undefined}>
            {columns.map((col) => {
              const headerClasses = [
                col.headerClassName,
                col.align === "right" || col.isAction ? "col-actions text-end" : "",
                col.isNumber ? "col-number text-end" : "",
              ].filter(Boolean).join(" ") || undefined;

              return (
                <th key={col.key} className={headerClasses}>
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={bodyClassName || undefined}>
          {loading
            ? loadingComponent
            : rows.length === 0
              ? emptyComponent
              : rows.map((row, rowIndex) => (
                  <tr key={rowKey(row, rowIndex)}>
                    {columns.map((col) => {
                      const cellClasses = [
                        col.cellClassName,
                        col.align === "right" || col.isAction ? "col-actions text-end" : "",
                        col.isNumber ? "col-number text-end" : "",
                      ].filter(Boolean).join(" ") || undefined;

                      return (
                        <td key={col.key} className={cellClasses}>
                          {col.render ? col.render(row, rowIndex) : row[col.key]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
        </tbody>
      </Table>
    </div>
  );
}

export default DataTable;
