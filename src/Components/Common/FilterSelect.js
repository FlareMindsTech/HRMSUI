import React from "react";
import { Form } from "react-bootstrap";

/**
 * FilterSelect — shared dropdown filter for table filter bars.
 *
 * Rules:
 * - Tokens only (no hex, no !important)
 * - Height: 36px (--control-h) or 30px for sm (--control-h-sm)
 * - Radius: 8px (--r-sm), Border: --c-border with gold focus ring
 */
function FilterSelect({
  value,
  onChange,
  options = [],
  placeholder = "Filter",
  allValue = "all",
  size = "sm",
  minWidth,
  className = "",
  ariaLabel,
  style,
}) {
  const isSm = size === "sm";

  const selectClasses = [
    "form-select-ui",
    isSm ? "form-select-sm" : "",
    className,
  ].filter(Boolean).join(" ");

  const wrapperStyle = minWidth
    ? { minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth, ...style }
    : style;

  return (
    <div className="filter-select-wrapper" style={wrapperStyle}>
      <Form.Select
        size={size}
        className={selectClasses}
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
