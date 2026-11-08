import React from 'react';

const NODES = [
  { id: 1, name: 'Node 1 (Alpha)', role: 'Primary Leader', latency: '< 1ms', ip: '127.0.0.1:8081' },
  { id: 2, name: 'Node 2 (Beta)', role: 'Secondary Store', latency: '< 1ms', ip: '127.0.0.1:8082' },
  { id: 3, name: 'Node 3 (Gamma)', role: 'Witness Node', latency: '< 1ms', ip: '127.0.0.1:8083' },
  { id: 4, name: 'Node 4 (Delta)', role: 'Replica A', latency: '< 1ms', ip: '127.0.0.1:8084' },
  { id: 5, name: 'Node 5 (Epsilon)', role: 'Replica B', latency: '< 1ms', ip: '127.0.0.1:8085' },
];

export default function NodeRack({ fileCount }) {
  return (
    <div className="section-container">
      <div className="section-header">
        <h2 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
          Distributed Storage Node Cluster (Simulated)
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Each node independently safeguards exactly one Shamir secret share per encrypted file
        </span>
      </div>

      <div className="node-rack-grid">
        {NODES.map((node) => (
          <div key={node.id} className="node-card healthy">
            <div className="node-card-top">
              <span className="node-name">{node.name}</span>
              <span className="node-indicator green">
                <span className="pulse-dot"></span>
                ACTIVE
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {node.role}
            </div>

            <div className="node-share-slot">
              <span>Shares Stored</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{fileCount}</span>
            </div>

            <div className="node-share-slot" style={{ marginTop: '4px' }}>
              <span>Local Endpoint</span>
              <span>{node.ip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
