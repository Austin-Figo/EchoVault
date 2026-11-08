import React, { useState } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

export default function VaultSettings({ health, files, onRefreshAll, showToast }) {
  const [confirmPurgeAll, setConfirmPurgeAll] = useState(false);
  const [purging, setPurging] = useState(false);
  const [audioVol, setAudioVol] = useState(cyberAudio.enabled ? 'ON' : 'OFF');

  const handleToggleAudio = () => {
    try {
      const next = cyberAudio.toggle();
      setAudioVol(next ? 'ON' : 'OFF');
      if (next) cyberAudio.playBeep(880);
      showToast(`Audio telemetry ${next ? 'enabled' : 'muted'}`, 'info');
    } catch (e) {
      console.warn('Audio error:', e);
    }
  };

  const handlePurgeAll = async () => {
    if (!confirmPurgeAll) {
      setConfirmPurgeAll(true);
      return;
    }
    setPurging(true);
    try {
      const allFiles = await fetch('/api/files').then(r => r.json());
      let deleted = 0;
      for (const f of allFiles) {
        const res = await fetch(`/api/files/${f.id}`, { method: 'DELETE' });
        if (res.ok) deleted++;
      }
      showToast(`Purged ${deleted} vault object(s) and all Shamir shares`, 'success');
      onRefreshAll();
    } catch (err) {
      showToast(`Purge error: ${err.message}`, 'error');
    } finally {
      setPurging(false);
      setConfirmPurgeAll(false);
    }
  };

  return (
    <div>
      {/* System Configuration */}
      <div className="section-container cyber-card" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <div>
            <div className="cyber-tag-sub">SYSTEM CONFIGURATION</div>
            <h2 className="section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
              </svg>
              Vault Settings &amp; Administration
            </h2>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              try { cyberAudio.playBeep(700); } catch {}
              onRefreshAll();
              showToast('Cluster settings refreshed', 'info');
            }}
          >
            Refresh Settings
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="cyber-stat-box">
            <span className="cyber-label">ENCRYPTION STANDARD</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-cyan)', fontSize: '1.1rem' }}>AES-256-GCM</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              256-bit key &bull; 96-bit random nonce &bull; 128-bit GHASH auth tag
            </p>
          </div>
          <div className="cyber-stat-box">
            <span className="cyber-label">SECRET SHARING SCHEME</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-emerald)', fontSize: '1.1rem' }}>Shamir 3-of-5</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Lagrange interpolation &bull; GF(2<sup>8</sup>) &bull; Polynomial 0x11B
            </p>
          </div>
          <div className="cyber-stat-box">
            <span className="cyber-label">DATABASE BACKEND</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-amber)', fontSize: '1.1rem' }}>
              {health?.activeDatabase || 'H2 File Persistent'}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Local H2 file DB &bull; MySQL migration ready
            </p>
          </div>
          <div className="cyber-stat-box">
            <span className="cyber-label">STORAGE BOUNDARY</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#fff', marginTop: '6px', wordBreak: 'break-all' }}>
              {health?.storagePath || './storage'}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              UUID-named .enc ciphertext files &bull; sandboxed
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: '4px', color: '#fff' }}>
              AUDIO TELEMETRY SYNTHESIZER
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Web Audio API &mdash; generates real-time audio feedback for encryption, recovery, and alerts without external audio files
            </div>
          </div>
          <button
            className={`btn ${audioVol === 'ON' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleToggleAudio}
          >
            {audioVol === 'ON' ? 'AUDIO ACTIVE' : 'MUTED'}
          </button>
        </div>
      </div>

      {/* Vault Ledger Management */}
      <div className="section-container cyber-card" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <div>
            <div className="cyber-tag-sub">VAULT LEDGER MANAGEMENT</div>
            <h2 className="section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-rose)" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Encrypted Object Registry ({files.length} records)
            </h2>
          </div>
        </div>

        {files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
            <p>Vault ledger is currently empty. Upload files in the Cypher Ledger tab.</p>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            {files.map(f => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(10,15,26,0.5)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{f.originalFileName}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '12px', fontFamily: 'var(--font-mono)' }}>
                    {(f.fileSize / 1024).toFixed(1)} KB &bull; {f.totalShares} shares
                  </span>
                </div>
                <span className="shares-pill healthy">
                  <span className="pulse-dot"></span>
                  RECOVERABLE (3-OF-5)
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(255,0,85,0.06)', border: '1px solid rgba(255,0,85,0.25)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontWeight: 700, color: 'var(--neon-rose)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
            PURGE ALL VAULT OBJECTS
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Permanently destroys all encrypted ciphertext files and all Shamir key shares from the database. This action is irreversible.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-danger"
              onClick={handlePurgeAll}
              disabled={purging || files.length === 0}
            >
              {purging
                ? 'Purging All Records...'
                : confirmPurgeAll
                  ? 'CONFIRM PURGE ALL (IRREVERSIBLE)'
                  : `Purge All ${files.length} Object(s)`}
            </button>
            {confirmPurgeAll && (
              <button className="btn btn-secondary" onClick={() => setConfirmPurgeAll(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="section-container cyber-card">
        <div className="section-header">
          <div>
            <div className="cyber-tag-sub">ARCHITECTURE OVERVIEW</div>
            <h2 className="section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-violet)" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              Technology Stack &amp; Cryptographic Specifications
            </h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Backend Layer', color: 'var(--neon-amber)', items: ['Spring Boot 3.3.4 (Java 21 LTS)', 'Spring Data JPA + H2 / MySQL', 'Maven build orchestration', 'javax.crypto AES-256-GCM'] },
            { label: 'Frontend Layer', color: 'var(--neon-cyan)', items: ['React 18 + Vite 5', 'Web Audio API real-time synth', 'Interactive SVG Orbital Topology', 'In-browser payload preview engine'] },
            { label: 'Cryptographic Engine', color: 'var(--neon-emerald)', items: ['AES-256-GCM authenticated cipher', 'Shamir (k=3, n=5) threshold scheme', 'Finite field GF(2^8) arithmetic', 'SecureRandom key & nonce creation'] },
            { label: 'Security Guarantees', color: 'var(--neon-rose)', items: ['Zero-knowledge key storage in RAM', 'Keys wiped immediately after split', 'AES-GCM GHASH tamper authentication', 'Path-traversal sandboxed storage'] },
          ].map(({ label, color, items }) => (
            <div key={label} className="cyber-stat-box">
              <span className="cyber-label" style={{ color }}>{label.toUpperCase()}</span>
              <ul style={{ listStyle: 'none', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map(item => (
                  <li key={item} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color, fontSize: '0.65rem' }}>&bull;</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
