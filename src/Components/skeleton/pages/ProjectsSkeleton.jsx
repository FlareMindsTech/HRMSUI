import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonButton } from '../index';

export default function ProjectsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Projects & Tasks"
      className="sk-container"
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Skeleton width="130px" height="28px" style={{ marginBottom: '6px' }} />
          <Skeleton width="260px" height="14px" />
        </div>
        <SkeletonButton width="130px" height="38px" radius="var(--sk-radius-sm)" />
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['50px', '85px', '100px', '110px'].map((w, i) => (
          <Skeleton key={i} width={w} height="32px" radius="var(--sk-radius-full)" />
        ))}
      </div>

      {/* 4-Column Kanban Board */}
      <div className="sk-kanban-board">
        {['To do', 'In progress', 'In review', 'Done'].map((colName, colIdx) => (
          <div key={colIdx} className="sk-kanban-column">
            {/* Column Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Skeleton width="10px" height="10px" radius="var(--sk-radius-full)" />
                <Skeleton width="75px" height="16px" />
              </div>
              <Skeleton width="22px" height="20px" radius="var(--sk-radius-sm)" />
            </div>

            {/* Task Card 1 */}
            <div className="sk-card" style={{ padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <Skeleton width="60px" height="20px" radius="var(--sk-radius-xs)" />
                <Skeleton width="50px" height="20px" radius="var(--sk-radius-xs)" />
              </div>
              <Skeleton width="85%" height="16px" style={{ marginBottom: '16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="80px" height="12px" />
                <SkeletonAvatar size="24px" />
              </div>
            </div>

            {/* Task Card 2 */}
            <div className="sk-card" style={{ padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <Skeleton width="70px" height="20px" radius="var(--sk-radius-xs)" />
              </div>
              <Skeleton width="92%" height="16px" style={{ marginBottom: '6px' }} />
              <Skeleton width="60%" height="14px" style={{ marginBottom: '16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="90px" height="12px" />
                <SkeletonAvatar size="24px" />
              </div>
            </div>

            {/* Optional Empty/Add placeholder */}
            <Skeleton width="100%" height="34px" radius="var(--sk-radius-sm)" style={{ opacity: 0.6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

