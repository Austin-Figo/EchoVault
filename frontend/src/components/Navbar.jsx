import React, { useState, useEffect } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

export default function Navbar({ health, onRefresh, isRefreshing, onOpenVivaTour }) {
  const isHealthy = health?.status === 'UP';
  const [clock, setClock] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = cyberAudio.toggle();
    setAudioEnabled(next);
    if (next) cyberAudio.playBeep(880);
  };

  return (
    <header className="header-banner">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
          <h1 className="page-title cyber-glitch-title">
            ECHOVAULT <span className="title-sub">// QUANTUM-SAFE CIPHER VAULT</span>
          </h1>
          <span className={`system-badge ${isHealthy ? 'active' : 'offline'}`}>
            <span className="pulse-dot" style={{ background: isHealthy ? 'var(--neon-emerald)' : 'var(--neon-rose)' }}></span>
            {isHealthy ? 'GRID ARMED & SECURE' : 'GRID DISCONNECTED'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <p className="page-description">
            Autonomous threshold storage matrix enforcing <strong>AES-256-GCM authenticated encryption</strong> and <strong>Shamir's (3-of-5) Secret Sharing</strong> over Galois Field GF(2<sup>8</sup>).
          </p>
          <span className="utc-clock-badge">{clock}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            try { cyberAudio.playBeep(880); } catch {}
            if (onOpenVivaTour) onOpenVivaTour();
          }}
          title="Open Interactive Viva & Architecture Walkthrough"
          style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(168, 85, 247, 0.3))', border: '1px solid var(--neon-cyan)', color: '#fff' }}
        >
          ⚡ Viva Walkthrough
        </button>

        <button
          className={`btn btn-secondary btn-sm ${audioEnabled ? 'audio-on' : 'audio-off'}`}
          onClick={toggleSound}
          title="Toggle Synthesizer Audio Telemetry"
        >
          {audioEnabled ? '🔊 AUDIO ON' : '🔇 MUTED'}
        </button>

        <div className="crypto-spec-pill">
          <div className="spec-item">
            <span className="spec-label">ENCRYPTION CIPHER</span>
            <span className="spec-val">AES-256-GCM</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
          <div className="spec-item">
            <span className="spec-label">RECOVERY QUORUM</span>
            <span className="spec-val">3-OF-5 THRESHOLD</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
          <div className="spec-item">
            <span className="spec-label">FIELD ARITHMETIC</span>
            <span className="spec-val">GF(2<sup>8</sup>) RIJNDAEL</span>
          </div>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={() => {
            cyberAudio.playBeep(880);
            onRefresh();
          }} 
          disabled={isRefreshing}
          title="Synchronize Grid State"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}>
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
          </svg>
          {isRefreshing ? 'Syncing...' : 'Sync Grid'}
        </button>
      </div>
    </header>
  );
}
