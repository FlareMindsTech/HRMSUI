import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonText({
  lines = 3,
  height = '14px',
  gap = 'var(--sk-space-2)',
  lastLineWidth = '60%',
  radius = 'var(--sk-radius-xs)',
  className = '',
  style = {},
}) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap, width: '100%', ...style }}
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1;
        return (
          <Skeleton
            key={index}
            height={height}
            width={isLast && lines > 1 ? lastLineWidth : '100%'}
            radius={radius}
          />
        );
      })}
    </div>
  );
}

