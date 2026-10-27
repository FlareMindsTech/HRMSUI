import React from "react";
import { Form, InputGroup } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";

/**
 * SearchInput — shared controlled search field.
 *
 * Rules:
 * - Tokens only (no hex, no !important)
 * - Height: 36px (--control-h) or 30px for sm (--control-h-sm)
 * - Radius: 8px (--r-sm)
 * - Border: --c-border with gold focus ring
 */
function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  size,
  layout = "input-group",
  icon: Icon = FaSearch,
  iconSize = 14,
  iconClassName = "",
  inputGroupClassName = "",
  inputGroupTextClassName = "",
  inputGroupStyle,
  inputClassName = "",
  wrapperClassName = "",
  type = "text",
  disabled = false,
  autoFocus = false,
  name,
  id,
  ariaLabel,
}) {
  const isSm = size === "sm";

  const groupTextClasses = [
    "search-input-addon",
    isSm ? "addon-sm" : "",
    "text-muted",
    inputGroupTextClassName,
  ].filter(Boolean).join(" ");

  const controlClasses = [
    "form-control-ui",
    isSm ? "form-control-sm" : "",
    layout === "input-group" ? "border-start-0" : "",
    inputClassName,
  ].filter(Boolean).join(" ");

  const control = (
    <Form.Control
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={controlClasses}
      disabled={disabled}
      autoFocus={autoFocus || undefined}
      name={name}
      id={id}
      aria-label={ariaLabel || placeholder}
    />
  );

  if (layout === "overlay") {
    return (
      <div className={`position-relative ${wrapperClassName}`.trim()}>
        {Icon ? (
          <span
            className={`position-absolute top-50 start-0 translate-middle-y ps-3 text-muted pe-none ${iconClassName}`.trim()}
          >
            <Icon size={iconSize} />
          </span>
        ) : null}
        <div className={Icon ? "ps-4" : undefined}>
          {control}
        </div>
      </div>
    );
  }

  return (
    <InputGroup
      size={size}
      className={`search-input-group ${inputGroupClassName}`.trim()}
      style={inputGroupStyle}
    >
      <InputGroup.Text className={groupTextClasses}>
        {Icon ? <Icon size={iconSize} className={iconClassName || undefined} /> : null}
      </InputGroup.Text>
      {control}
    </InputGroup>
  );
}

export default SearchInput;
