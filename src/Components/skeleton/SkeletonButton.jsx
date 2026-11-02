import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonButton({
  width = '100px',
  height = '36px',
  radius = 'var(--sk-radius-sm)',
  className = '',
  style = {},
  ...props
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      radius={radius}
      className={className}
      style={{ flexShrink: 0, ...style }}
      {...props}
    />
  );
}

