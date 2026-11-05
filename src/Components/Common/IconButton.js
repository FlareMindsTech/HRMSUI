import React, { forwardRef } from "react";
import Button from "./Button";

/**
 * IconButton — Standard square/circular icon action button (e.g. table rows, dismiss, tools)
 */
const IconButton = forwardRef(function IconButton(
  {
    icon: Icon,
    children,
    title,
    ariaLabel,
    variant = "icon",
    size = "md", // "sm" | "md" | "lg"
    className = "",
    ...props
  },
  ref
) {
  const iconContent = Icon
    ? typeof Icon === "function"
      ? <Icon />
      : Icon
    : children;

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      title={title}
      ariaLabel={ariaLabel || title}
      className={`btn-ui-icon-only ${className}`.trim()}
      {...props}
    >
      {iconContent}
    </Button>
  );
});

export { IconButton };
export default IconButton;

