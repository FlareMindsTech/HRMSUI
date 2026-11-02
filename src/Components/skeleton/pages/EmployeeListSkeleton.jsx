import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonButton } from '../index';

export default function EmployeeListSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Employee List"
      className="sk-container"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Skeleton width="180px" height="28px" style={{ marginBottom: '8px' }} />
          <Skeleton width="240px" height="16px" />
        </div>
        <SkeletonButton width="140px" height="40px" radius="var(--sk-radius-md)" />
      </div>

      <div className="sk-card" style={{ marginBottom: '20px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Skeleton width="280px" height="38px" radius="var(--sk-radius-sm)" style={{ flex: '1 1 240px' }} />
          <Skeleton width="140px" height="38px" radius="var(--sk-radius-sm)" />
          <Skeleton width="140px" height="38px" radius="var(--sk-radius-sm)" />
        </div>
      </div>

      <div className="sk-table-container sk-table-wrapper-desktop">
        <table className="sk-table">
          <thead className="sk-table-head">
            <tr>
              <th style={{ width: '28%' }}><Skeleton width="90px" height="14px" /></th>
              <th style={{ width: '20%' }}><Skeleton width="80px" height="14px" /></th>
              <th style={{ width: '20%' }}><Skeleton width="70px" height="14px" /></th>
              <th style={{ width: '16%' }}><Skeleton width="60px" height="14px" /></th>
              <th style={{ width: '16%', textAlign: 'right' }}><Skeleton width="50px" height="14px" style={{ marginLeft: 'auto' }} /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="sk-table-row">
                <td>
                  <div className="sk-table-cell-user">
                    <SkeletonAvatar size="36px" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="120px" height="14px" style={{ marginBottom: '4px' }} />
                      <Skeleton width="160px" height="12px" />
                    </div>
                  </div>
                </td>
                <td><Skeleton width="110px" height="14px" /></td>
                <td><Skeleton width="100px" height="14px" /></td>
                <td><Skeleton width="68px" height="22px" radius="var(--sk-radius-full)" /></td>
                <td><Skeleton width="72px" height="28px" radius="var(--sk-radius-sm)" style={{ marginLeft: 'auto' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sk-mobile-cards">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="sk-card">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
              <SkeletonAvatar size="44px" />
              <div style={{ flex: 1 }}>
                <Skeleton width="140px" height="16px" style={{ marginBottom: '4px' }} />
                <Skeleton width="180px" height="13px" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <Skeleton width="90px" height="14px" />
              <Skeleton width="90px" height="14px" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="70px" height="24px" radius="var(--sk-radius-full)" />
              <Skeleton width="80px" height="32px" radius="var(--sk-radius-sm)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

