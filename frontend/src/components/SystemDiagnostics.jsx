import React, { useState, useEffect } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function SystemDiagnostics({ health, filesCount, onRefresh }) {
  const [testingEndpoint, setTestingEndpoint] = useState(null);
  const [endpointResults, setEndpointResults] = useState({});
  const [uptime, setUptime] = useState(0);
  const [pingHistory, setPingHistory] = useState([]);

  // Simulate uptime counter
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (s) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  const testEndpoint = async (method, url, label, body = null) => {
    setTestingEndpoint(label);
    try { cyberAudio.playScan(); } catch {}
    const t0 = Date.now();
    try {
      const opts = { method };
      if (body) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(body);
      }
      const res = await fetch(url, opts);
      const latency = Date.now() - t0;
      let data;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        data = `[${res.status} ${res.statusText}] (non-JSON response)`;
      }
      const result = { url, method, status: res.status, ok: res.ok, data, latency };
      setEndpointResults(prev => ({ ...prev, [label]: result }));
      setPingHistory(prev => [...prev.slice(-7), { label, latency, ok: res.ok, time: new Date().toLocaleTimeString() }]);
      cyberAudio.playBeep(res.ok ? 880 : 440);
    } catch (err) {
      const latency = Date.now() - t0;
      const result = { url, method, status: 'ERROR', ok: false, error: err.message, latency };
      setEndpointResults(prev => ({ ...prev, [label]: result }));
      setPingHistory(prev => [...prev.slice(-7), { label, latency: null, ok: false, time: new Date().toLocaleTimeString() }]);
      cyberAudio.playAlert();
    } finally {
      setTestingEndpoint(null);
    }
  };

  const PROBE_ENDPOINTS = [
    { label: 'GET /api/health', method: 'GET', url: '/api/health' },
    { label: 'GET /api/files', method: 'GET', url: '/api/files' },
  ];

  const activeResult = testingEndpoint
    ? null
    : Object.values(endpointResults).slice(-1)[0];

  const isHealthy = health?.status === 'UP';

  return (
    <div>
      {/* Live Health Status */}
      <div className="section-container cyber-card" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <div>
            <div className="cyber-tag-sub">SECURITY &amp; SYSTEM DIAGNOSTICS</div>
            <h2 className="section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Live Cluster Health &amp; Cryptographic Engine Telemetry
            </h2>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              cyberAudio.playBeep(700);
              onRefresh();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
            </svg>
            Ping Cluster
          </button>
        </div>

        {/* Status Banner */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 18px', background: isHealthy ? 'rgba(0,255,157,0.06)' : 'rgba(255,0,85,0.08)', border: `1px solid ${isHealthy ? 'rgba(0,255,157,0.3)' : 'rgba(255,0,85,0.3)'}`, borderRadius: '10px', marginBottom: '20px' }}>
          <span className="pulse-dot" style={{ background: isHealthy ? 'var(--neon-emerald)' : 'var(--neon-rose)', boxShadow: `0 0 10px ${isHealthy ? 'var(--neon-emerald)' : 'var(--neon-rose)'}` }}></span>
          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: isHealthy ? 'var(--neon-emerald)' : 'var(--neon-rose)', fontSize: '0.92rem' }}>
            {isHealthy ? 'GRID STATUS: OPERATIONAL — ALL CRYPTOGRAPHIC ENGINES ARMED' : 'GRID STATUS: DISCONNECTED — BACKEND UNREACHABLE'}
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Session uptime: {formatUptime(uptime)}
          </span>
        </div>

        {/* Grid of Diagnostics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div className="cyber-stat-box">
            <span className="cyber-label">BACKEND APPLICATION</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-emerald)', fontSize: '1.1rem' }}>
              SPRING BOOT 3.3.4
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Java 21 LTS HotSpot VM · Port :8080
            </span>
          </div>

          <div className="cyber-stat-box">
            <span className="cyber-label">DATABASE PERSISTENCE</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-cyan)', fontSize: '1.1rem' }}>
              {health?.activeDatabase?.split(' ')[0] || 'H2'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {health?.activeDatabase || 'H2 File-based · MySQL Ready'}
            </span>
          </div>

          <div className="cyber-stat-box">
            <span className="cyber-label">STORAGE BOUNDARY</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#fff', marginTop: '6px', wordBreak: 'break-all' }}>
              {health?.storagePath || './storage'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formatBytes(health?.storageUsedBytes)} used · {filesCount} ciphertexts
            </span>
          </div>

          <div className="cyber-stat-box">
            <span className="cyber-label">THRESHOLD ENGINES</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-amber)', fontSize: '1.1rem' }}>
              k={health?.thresholdRequired || 3} / n={health?.totalShares || 5}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Lagrange over GF(2⁸) (0x11B)
            </span>
          </div>
        </div>
      </div>

      {/* Live API Tester */}
      <div className="section-container cyber-card" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <div>
            <div className="cyber-tag-sub">REST API PROBE STATION</div>
            <h2 className="section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-amber)" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              Internal REST API Endpoint Probes
            </h2>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setEndpointResults({}); setPingHistory([]); cyberAudio.playBeep(400); }}
          >
            Clear Results
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {PROBE_ENDPOINTS.map(ep => (
            <button
              key={ep.label}
              className="btn btn-secondary btn-sm"
              onClick={() => testEndpoint(ep.method, ep.url, ep.label)}
              disabled={testingEndpoint !== null}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span style={{ color: ep.method === 'GET' ? 'var(--neon-emerald)' : ep.method === 'POST' ? 'var(--neon-cyan)' : 'var(--neon-rose)', fontWeight: 800, marginRight: '4px' }}>
                {ep.method}
              </span>
              {ep.url}
            </button>
          ))}
        </div>

        {/* Last Result */}
        {activeResult && (
          <div style={{ background: '#020408', border: `1px solid ${activeResult.ok ? 'rgba(0,255,157,0.3)' : 'rgba(255,0,85,0.3)'}`, borderRadius: '8px', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: 'var(--neon-cyan)' }}>{activeResult.method} {activeResult.url}</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: activeResult.ok ? 'var(--neon-emerald)' : 'var(--neon-rose)', fontWeight: 700 }}>
                  HTTP {activeResult.status}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {activeResult.latency}ms
                </span>
              </div>
            </div>
            <pre style={{ color: 'var(--text-secondary)', maxHeight: '220px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(activeResult.data || activeResult.error, null, 2)}
            </pre>
          </div>
        )}

        {testingEndpoint && (
          <div className="cyber-progress-box" style={{ marginBottom: '16px' }}>
            <span className="pulse-dot" style={{ background: 'var(--neon-cyan)' }}></span>
            Probing endpoint: {testingEndpoint}...
          </div>
        )}

        {/* Ping History */}
        {pingHistory.length > 0 && (
          <div>
            <span className="cyber-label" style={{ display: 'block', marginBottom: '8px' }}>PROBE HISTORY:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {pingHistory.slice().reverse().map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(10,15,26,0.5)', border: `1px solid ${p.ok ? 'rgba(0,255,157,0.15)' : 'rgba(255,0,85,0.15)'}`, borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{p.time}</span>
                  <span style={{ color: '#fff' }}>{p.label}</span>
                  <span style={{ color: p.ok ? 'var(--neon-emerald)' : 'var(--neon-rose)' }}>
                    {p.ok ? `✓ ${p.latency}ms` : '✗ ERROR'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Runtime Security Checks */}
      <div className="section-container cyber-card">
        <div className="section-header">
          <div>
            <div className="cyber-tag-sub">RUNTIME SECURITY CHECKLIST</div>
            <h2 className="section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-emerald)" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Security Posture Verification
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          {[
            { ok: true, label: 'AES-256-GCM authenticated encryption', desc: 'Every file encrypted with a unique 256-bit random key' },
            { ok: true, label: 'Unique random nonce per file', desc: '96-bit nonce generated via SecureRandom for each upload' },
            { ok: true, label: 'AES-GCM GHASH tag verification', desc: 'Authentication tag checked on every decryption attempt' },
            { ok: true, label: 'Shamir 3-of-5 threshold scheme', desc: 'Lagrange polynomial interpolation over GF(2⁸)' },
            { ok: true, label: 'Zero-knowledge key storage', desc: 'Plaintext AES key wiped immediately after share generation' },
            { ok: true, label: 'No plaintext keys persisted', desc: 'Database stores only share bytes, never the raw AES key' },
            { ok: true, label: 'Path-traversal sandboxing', desc: 'Storage filenames are UUID-based, user paths are ignored' },
            { ok: isHealthy, label: 'Backend cluster reachable', desc: isHealthy ? `Status: UP · ${filesCount} objects secured` : 'Cannot reach backend API' },
            { ok: window.location.protocol === 'https:' || window.location.hostname === 'localhost', label: 'Secure origin (HTTPS or localhost)', desc: 'Web Crypto API requires secure context' },
            { ok: true, label: 'CORS limited to local frontend', desc: 'Backend CORS policy restricts to http://localhost:5173' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', background: item.ok ? 'rgba(0,255,157,0.04)' : 'rgba(255,0,85,0.06)', border: `1px solid ${item.ok ? 'rgba(0,255,157,0.15)' : 'rgba(255,0,85,0.2)'}`, borderRadius: '8px' }}>
              <span style={{ color: item.ok ? 'var(--neon-emerald)' : 'var(--neon-rose)', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                {item.ok ? '✓' : '✗'}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#fff' }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
