import React from "react";
import { Form } from "react-bootstrap";

/**
 * FilterSelect — shared dropdown filter for table filter bars.
 *
 * Mirrors the small filter `<Form.Select>` controls used across list pages
 * (UserManagement users/roles tables) so every filter dropdown renders and
 * behaves identically. Presentational only: value/onChange (including side
 * effects such as pagination resets) and option lists stay with the caller.
 *
 * Props (value + onChange + options required; rest optional):
 *  value, onChange   controlled select props (event passed straight through)
 *  options           [{ value, label }] (placeholder rendered separately)
 *  placeholder       label for the "all" option (e.g. "Role")
 *  allValue          value meaning "no filter" (default "all")
 *  size              select size (default "sm")
 *  minWidth          wrapper min-width px (default 160)
 *  className         Control classes passthrough
 *  ariaLabel         optional; falls back to placeholder
 */
function FilterSelect({
  value,
  onChange,
  options = [],
  placeholder = "Filter",
  allValue = "all",
  size = "sm",
  minWidth = 160,
  className,
  ariaLabel,
}) {
  return (
    <div style={{ minWidth }}>
      <Form.Select
        size={size}
        className={className || undefined}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel || placeholder}
      >
        <option value={allValue}>{placeholder}</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>
    </div>
  );
}

export default FilterSelect;
