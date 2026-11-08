import React from 'react';
import { cyberAudio } from '../utils/cyberAudio';

const NODES_CONFIG = [
  { id: 1, name: 'ALPHA', role: 'Primary Leader', angle: 270, ip: '127.0.0.1:8081' },
  { id: 2, name: 'BETA', role: 'Secondary Store', angle: 342, ip: '127.0.0.1:8082' },
  { id: 3, name: 'GAMMA', role: 'Witness Node', angle: 54, ip: '127.0.0.1:8083' },
  { id: 4, name: 'DELTA', role: 'Replica A', angle: 126, ip: '127.0.0.1:8084' },
  { id: 5, name: 'EPSILON', role: 'Replica B', angle: 198, ip: '127.0.0.1:8085' },
];

export default function NetworkTopology({
  activeNodes,
  onToggleNode,
  fileCount,
  thresholdRequired = 3
}) {
  const activeCount = activeNodes.length;
  const isThresholdMet = activeCount >= thresholdRequired;

  const handleNodeClick = (nodeId) => {
    cyberAudio.playBeep(activeNodes.includes(nodeId) ? 440 : 880);
    onToggleNode(nodeId);
  };

  // Center is at (250, 250), radius 170
  const cx = 250;
  const cy = 250;
  const radius = 165;

  return (
    <div className="section-container cyber-topology-card">
      <div className="section-header">
        <div>
          <div className="cyber-tag-sub">HOLOGRAPHIC TOPOLOGY MAP</div>
          <h2 className="section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="12" cy="3" r="2"/>
              <circle cx="21" cy="9" r="2"/>
              <circle cx="19" cy="19" r="2"/>
              <circle cx="5" cy="19" r="2"/>
              <circle cx="3" cy="9" r="2"/>
              <path d="M12 5v4M19 11l-4 2M17 18l-3-4M7 18l3-4M5 11l4 2"/>
            </svg>
            Distributed Cypher-Core Cluster
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`cyber-pill ${isThresholdMet ? 'active' : 'alert'}`}>
            <span className="cyber-pulse-dot"></span>
            {isThresholdMet ? `CORE STABLE: ${activeCount}/5 ONLINE (≥3 REQ)` : `CRITICAL: ${activeCount}/5 DEFICIENT (<3)`}
          </span>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              cyberAudio.playLock();
              // Reset all to online
              [1, 2, 3, 4, 5].forEach(id => {
                if (!activeNodes.includes(id)) onToggleNode(id);
              });
            }}
          >
            Reset All Nodes
          </button>
        </div>
      </div>

      <div className="topology-interactive-wrapper">
        <svg className="topology-svg" viewBox="0 0 500 500">
          <defs>
            {/* Core Glow Filter */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Grid Pattern */}
            <pattern id="cyber-grid-pat" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(0, 240, 255, 0.04)" strokeWidth="0.8"/>
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="500" height="500" fill="url(#cyber-grid-pat)"/>

          {/* Range rings */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeDasharray="3 6"/>
          <circle cx={cx} cy={cy} r={radius + 35} fill="none" stroke="rgba(0, 240, 255, 0.05)"/>
          <circle cx={cx} cy={cy} r="85" fill="none" stroke="rgba(0, 240, 255, 0.15)" strokeDasharray="6 4"/>

          {/* Connection Lines from Core to Satellite Nodes */}
          {NODES_CONFIG.map((node) => {
            const rad = (node.angle * Math.PI) / 180;
            const nx = cx + radius * Math.cos(rad);
            const ny = cy + radius * Math.sin(rad);
            const isOnline = activeNodes.includes(node.id);

            return (
              <g key={`link-${node.id}`}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={nx}
                  y2={ny}
                  stroke={isOnline ? 'rgba(0, 240, 255, 0.5)' : 'rgba(255, 0, 85, 0.3)'}
                  strokeWidth={isOnline ? '2' : '1.5'}
                  strokeDasharray={isOnline ? 'none' : '4 4'}
                />
                {isOnline && (
                  <circle
                    r="3.5"
                    fill="var(--neon-cyan)"
                    filter="url(#glow-cyan)"
                  >
                    <animateMotion
                      path={`M ${cx} ${cy} L ${nx} ${ny}`}
                      dur={`${1.8 + node.id * 0.3}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Central Cypher Core */}
          <g className="central-core-group">
            {/* Spinning decorative ring */}
            <circle
              cx={cx}
              cy={cy}
              r="62"
              fill="none"
              stroke={isThresholdMet ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 0, 85, 0.4)'}
              strokeWidth="2"
              strokeDasharray="18 12 6 12"
              className="rotating-ring"
            />
            {/* Inner Core Disc */}
            <circle
              cx={cx}
              cy={cy}
              r="48"
              fill={isThresholdMet ? 'rgba(0, 30, 45, 0.92)' : 'rgba(40, 5, 15, 0.92)'}
              stroke={isThresholdMet ? 'var(--neon-cyan)' : 'var(--neon-rose)'}
              strokeWidth="2.5"
              filter={isThresholdMet ? 'url(#glow-cyan)' : 'url(#glow-rose)'}
            />

            {/* Core Text */}
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontWeight="800"
              letterSpacing="2"
              fontFamily="var(--font-mono)"
            >
              VAULT CORE
            </text>
            <text
              x={cx}
              y={cy + 6}
              textAnchor="middle"
              fill={isThresholdMet ? 'var(--neon-cyan)' : 'var(--neon-rose)'}
              fontSize="14"
              fontWeight="900"
              fontFamily="var(--font-mono)"
            >
              {isThresholdMet ? 'LOCKED (3-OF-5)' : 'SEVERED (<3)'}
            </text>
            <text
              x={cx}
              y={cy + 22}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="8"
              fontFamily="var(--font-mono)"
            >
              {activeCount} NODES ROUTED
            </text>
          </g>

          {/* Satellite Node Points */}
          {NODES_CONFIG.map((node) => {
            const rad = (node.angle * Math.PI) / 180;
            const nx = cx + radius * Math.cos(rad);
            const ny = cy + radius * Math.sin(rad);
            const isOnline = activeNodes.includes(node.id);

            return (
              <g
                key={`node-${node.id}`}
                className="interactive-node"
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node Outer Ring */}
                <circle
                  cx={nx}
                  cy={ny}
                  r="28"
                  fill="rgba(10, 15, 26, 0.95)"
                  stroke={isOnline ? 'var(--neon-cyan)' : 'var(--neon-rose)'}
                  strokeWidth="2"
                  filter={isOnline ? 'url(#glow-cyan)' : 'url(#glow-rose)'}
                />

                {/* Node Content */}
                <text
                  x={nx}
                  y={ny - 6}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                >
                  NODE {node.id}
                </text>
                <text
                  x={nx}
                  y={ny + 7}
                  textAnchor="middle"
                  fill={isOnline ? 'var(--neon-cyan)' : 'var(--neon-rose)'}
                  fontSize="8"
                  fontWeight="800"
                  fontFamily="var(--font-mono)"
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </text>
                <text
                  x={nx}
                  y={ny + 18}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="6.5"
                  fontFamily="var(--font-mono)"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="topology-sidebar-stats">
          <div className="cyber-stat-box">
            <span className="cyber-label">SHAMIR THRESHOLD MATRIX</span>
            <div className="cyber-val-big" style={{ color: isThresholdMet ? 'var(--neon-emerald)' : 'var(--neon-rose)' }}>
              {activeCount} / 5 NODES ACTIVE
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {isThresholdMet
                ? 'Threshold satisfied. Lagrange polynomial interpolation over GF(2^8) will reconstruct original 256-bit AES master key.'
                : 'Threshold deficient. Information-theoretic security guarantees zero mathematical key leakage with fewer than 3 shares.'}
            </p>
          </div>

          <div className="topology-nodes-mini-list">
            {NODES_CONFIG.map((n) => {
              const isOnline = activeNodes.includes(n.id);
              return (
                <div
                  key={n.id}
                  className={`node-mini-row ${isOnline ? 'online' : 'offline'}`}
                  onClick={() => handleNodeClick(n.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-dot ${isOnline ? 'green' : 'red'}`}></span>
                    <strong style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>Node {n.id} - {n.name}</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: isOnline ? 'var(--neon-cyan)' : 'var(--neon-rose)' }}>
                    {isOnline ? 'ONLINE [CLICK TO DROP]' : 'DROPPED [CLICK TO RESTORE]'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
