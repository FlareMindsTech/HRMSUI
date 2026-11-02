import React from 'react';
import { Skeleton, SkeletonButton } from '../index';

export default function PayrollSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Payroll"
      className="sk-container"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Skeleton width="150px" height="28px" style={{ marginBottom: '8px' }} />
          <Skeleton width="220px" height="16px" />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <SkeletonButton width="110px" height="38px" radius="var(--sk-radius-md)" />
          <SkeletonButton width="130px" height="38px" radius="var(--sk-radius-md)" />
        </div>
      </div>

      <div className="sk-payroll-summary-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="sk-card" style={{ height: '110px' }}>
            <Skeleton width="40%" height="14px" style={{ marginBottom: '12px' }} />
            <Skeleton width="60%" height="26px" style={{ marginBottom: '6px' }} />
            <Skeleton width="30%" height="12px" />
          </div>
        ))}
      </div>

      <div className="sk-table-container">
        <table className="sk-table">
          <thead className="sk-table-head">
            <tr>
              <th style={{ width: '25%' }}><Skeleton width="100px" height="14px" /></th>
              <th style={{ width: '20%' }}><Skeleton width="70px" height="14px" /></th>
              <th style={{ width: '20%' }}><Skeleton width="80px" height="14px" /></th>
              <th style={{ width: '15%' }}><Skeleton width="60px" height="14px" /></th>
              <th style={{ width: '20%', textAlign: 'right' }}><Skeleton width="50px" height="14px" style={{ marginLeft: 'auto' }} /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="sk-table-row">
                <td><Skeleton width="140px" height="14px" /></td>
                <td><Skeleton width="90px" height="14px" /></td>
                <td><Skeleton width="80px" height="14px" /></td>
                <td><Skeleton width="65px" height="22px" radius="var(--sk-radius-full)" /></td>
                <td><Skeleton width="70px" height="28px" radius="var(--sk-radius-sm)" style={{ marginLeft: 'auto' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

