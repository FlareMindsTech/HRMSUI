import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonButton } from '../index';

export default function LeaveRequestsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Leave Requests"
      className="sk-container"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Skeleton width="170px" height="28px" style={{ marginBottom: '8px' }} />
          <Skeleton width="230px" height="16px" />
        </div>
        <SkeletonButton width="140px" height="40px" radius="var(--sk-radius-md)" />
      </div>

      <div className="sk-filter-chips">
        {['70px', '90px', '85px', '75px'].map((w, i) => (
          <Skeleton key={i} width={w} height="32px" radius="var(--sk-radius-full)" />
        ))}
      </div>

      <div className="sk-leave-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="sk-card sk-leave-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <SkeletonAvatar size="44px" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Skeleton width="130px" height="16px" />
                  <Skeleton width="70px" height="18px" radius="var(--sk-radius-full)" />
                </div>
                <Skeleton width="220px" height="14px" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Skeleton width="90px" height="34px" radius="var(--sk-radius-sm)" />
              <Skeleton width="90px" height="34px" radius="var(--sk-radius-sm)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

