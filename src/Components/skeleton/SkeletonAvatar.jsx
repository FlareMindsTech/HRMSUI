import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonAvatar({
  size = '40px',
  radius = 'var(--sk-radius-full)',
  className = '',
  style = {},
  ...props
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      radius={radius}
      className={className}
      style={{ flexShrink: 0, ...style }}
      {...props}
    />
  );
}

