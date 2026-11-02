import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonButton } from '../index';

export default function EmployeeProfileSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Employee Profile"
      className="sk-container"
    >
      <div className="sk-card" style={{ marginBottom: '24px' }}>
        <div className="sk-profile-header">
          <SkeletonAvatar size="80px" />
          <div style={{ flex: 1 }}>
            <Skeleton width="220px" height="26px" style={{ marginBottom: '8px' }} />
            <Skeleton width="160px" height="16px" style={{ marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Skeleton width="80px" height="22px" radius="var(--sk-radius-full)" />
              <Skeleton width="120px" height="22px" radius="var(--sk-radius-full)" />
            </div>
          </div>
          <SkeletonButton width="110px" height="38px" radius="var(--sk-radius-md)" />
        </div>
      </div>

      <div className="sk-tab-bar">
        {['100px', '120px', '90px', '110px'].map((w, i) => (
          <Skeleton key={i} width={w} height="32px" radius="var(--sk-radius-sm)" />
        ))}
      </div>

      <div className="sk-two-column-grid">
        <div className="sk-card">
          <Skeleton width="150px" height="20px" style={{ marginBottom: '20px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton width="30%" height="12px" style={{ marginBottom: '6px' }} />
                <Skeleton width="70%" height="16px" />
              </div>
            ))}
          </div>
        </div>

        <div className="sk-card">
          <Skeleton width="170px" height="20px" style={{ marginBottom: '20px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton width="30%" height="12px" style={{ marginBottom: '6px' }} />
                <Skeleton width="70%" height="16px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

