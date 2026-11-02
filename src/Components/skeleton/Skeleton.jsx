import React from 'react';
import './skeleton.css';

export default function Skeleton({
  width = '100%',
  height = '16px',
  radius = 'var(--sk-radius-sm)',
  className = '',
  style = {},
  ...props
}) {
  const inlineStyle = {
    width,
    height,
    borderRadius: radius,
    ...style,
  };

  return (
    <span
      className={`sk-block ${className}`.trim()}
      style={inlineStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

