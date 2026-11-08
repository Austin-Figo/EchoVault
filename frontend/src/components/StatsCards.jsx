import React from 'react';

function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function StatsCards({ health, filesCount, activeNodesCount = 5 }) {
  const fileCount = health?.fileCount ?? filesCount ?? 0;
  const storageUsed = formatBytes(health?.storageUsedBytes ?? 0);
  const threshold = `${health?.thresholdRequired || 3} of ${health?.totalShares || 5}`;

  return (
    <div className="stats-grid">
      <div className="stat-card cyber-card">
        <div className="stat-card-header">
          <span className="stat-title">VAULT REPOSITORY</span>
          <div className="stat-icon" style={{ color: 'var(--neon-cyan)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
        </div>
        <div className="stat-value" style={{ color: 'var(--neon-cyan)' }}>{fileCount}</div>
        <div className="stat-desc">Active AES-256-GCM ciphertexts</div>
      </div>

      <div className="stat-card cyber-card">
        <div className="stat-card-header">
          <span className="stat-title">RECOVERY QUORUM</span>
          <div className="stat-icon" style={{ color: 'var(--neon-emerald)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        </div>
        <div className="stat-value" style={{ color: 'var(--neon-emerald)' }}>{threshold}</div>
        <div className="stat-desc">Lagrange degree-2 threshold boundary</div>
      </div>

      <div className="stat-card cyber-card">
        <div className="stat-card-header">
          <span className="stat-title">CLUSTER NODES ACTIVE</span>
          <div className="stat-icon" style={{ color: activeNodesCount >= 3 ? 'var(--neon-cyan)' : 'var(--neon-rose)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/>
              <line x1="6" y1="18" x2="6.01" y2="18"/>
            </svg>
          </div>
        </div>
        <div className="stat-value" style={{ color: activeNodesCount >= 3 ? 'var(--neon-cyan)' : 'var(--neon-rose)' }}>
          {activeNodesCount} / 5
        </div>
        <div className="stat-desc">{activeNodesCount >= 3 ? 'Quorum satisfied' : 'Quorum breach risk'}</div>
      </div>

      <div className="stat-card cyber-card">
        <div className="stat-card-header">
          <span className="stat-title">ENCRYPTED DISK STORAGE</span>
          <div className="stat-icon" style={{ color: '#a78bfa' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
        </div>
        <div className="stat-value" style={{ color: '#a78bfa' }}>{storageUsed}</div>
        <div className="stat-desc">Physical footprint in /storage</div>
      </div>
    </div>
  );
}
