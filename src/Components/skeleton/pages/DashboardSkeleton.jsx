import React from 'react';
import { Skeleton } from '../index';

export default function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Dashboard"
      className="sk-container"
    >
      <div className="sk-dashboard-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sk-card" style={{ height: '120px' }}>
            <Skeleton width="45%" height="16px" style={{ marginBottom: '12px' }} />
            <Skeleton width="65%" height="28px" style={{ marginBottom: '8px' }} />
            <Skeleton width="35%" height="12px" />
          </div>
        ))}
      </div>

      <div className="sk-dashboard-body">
        <div className="sk-card" style={{ height: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <Skeleton width="160px" height="20px" />
            <Skeleton width="90px" height="28px" radius="var(--sk-radius-sm)" />
          </div>
          <Skeleton width="100%" height="280px" radius="var(--sk-radius-md)" />
        </div>

        <div className="sk-card" style={{ height: '380px' }}>
          <Skeleton width="140px" height="20px" style={{ marginBottom: '20px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Skeleton width="36px" height="36px" radius="var(--sk-radius-full)" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="85%" height="14px" style={{ marginBottom: '6px' }} />
                  <Skeleton width="40%" height="12px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

