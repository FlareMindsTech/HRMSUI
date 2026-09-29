import React from "react";
import { Form, InputGroup } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";

/**
 * SearchInput — shared controlled search field.
 *
 * Mirrors the two search structures already used across the app so call
 * sites render byte-identical markup to the inline inputs they replace:
 *  - layout "input-group" (default): InputGroup + icon Text + Form.Control
 *  - layout "overlay": plain wrapper div with a sibling icon + Form.Control
 *    (e.g. ProjectManagement's .pm-search-input-group)
 *
 * Presentational only: value/onChange (including side effects such as
 * pagination resets), filtering, debounce and fetch logic all stay with the
 * caller. No debounce is implemented — only one caller debounces today and
 * it does so in its own state.
 *
 * Props (value + onChange required; everything else optional):
 *  value, onChange         controlled input props (passed straight through)
 *  placeholder             default "Search..."
 *  size                    InputGroup size (default undefined — pass "sm"
 *                          where the original markup has it)
 *  layout                  "input-group" (default) | "overlay"
 *  icon                    icon component (default FaSearch)
 *  iconSize                optional icon size (e.g. 12)
 *  iconClassName           optional icon classes (default "" = no class attr)
 *  inputGroupClassName     optional InputGroup classes
 *  inputGroupTextClassName icon Text classes (default "bg-light border-end-0")
 *  inputGroupStyle         optional InputGroup style (e.g. { width: "220px" })
 *  inputClassName          Control classes (default "border-start-0 bg-light")
 *  wrapperClassName        wrapper div classes for "overlay" layout
 *  type                    default "text"
 *  disabled                default false
 *  autoFocus               default false
 *  name, id                optional native attrs
 *  ariaLabel               optional; when omitted no aria-label is rendered
 */
function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  size,
  layout = "input-group",
  icon: Icon = FaSearch,
  iconSize,
  iconClassName = "",
  inputGroupClassName = "",
  inputGroupTextClassName = "bg-light border-end-0",
  inputGroupStyle,
  inputClassName = "border-start-0 bg-light",
  wrapperClassName = "",
  type = "text",
  disabled = false,
  autoFocus = false,
  name,
  id,
  ariaLabel,
}) {
  const control = (
    <Form.Control
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={inputClassName || undefined}
      disabled={disabled}
      autoFocus={autoFocus || undefined}
      name={name}
      id={id}
      aria-label={ariaLabel}
    />
  );

  if (layout === "overlay") {
    return (
      <div className={wrapperClassName}>
        {Icon ? <Icon size={iconSize} className={iconClassName || undefined} /> : null}
        {control}
      </div>
    );
  }

  return (
    <InputGroup size={size} className={inputGroupClassName || undefined} style={inputGroupStyle}>
      <InputGroup.Text className={inputGroupTextClassName}>
        {Icon ? <Icon size={iconSize} className={iconClassName || undefined} /> : null}
      </InputGroup.Text>
      {control}
    </InputGroup>
  );
}

export default SearchInput;
