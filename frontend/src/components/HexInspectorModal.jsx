import React, { useState, useEffect } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

export default function HexInspectorModal({ fileId, fileName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try { cyberAudio.playScan(); } catch {}
    async function loadSample() {
      try {
        const res = await fetch(`/api/files/${fileId}/encrypted-sample`);
        if (!res.ok) throw new Error('Failed to load ciphertext sample');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSample();
  }, [fileId]);

  const formatHexDump = (hex) => {
    if (!hex) return [];
    const lines = [];
    for (let i = 0; i < hex.length; i += 32) {
      const chunk = hex.substr(i, 32);
      const offset = (i / 2).toString(16).padStart(8, '0');
      const hexPairs = chunk.match(/.{1,2}/g)?.join(' ') || '';
      lines.push(`${offset}: ${hexPairs}`);
    }
    return lines;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container hex-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Raw Ciphertext & Shannon Entropy Telemetry
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="cyber-label">CIPHERTEXT TARGET:</span>
              <span style={{ fontWeight: 700, marginLeft: '8px', color: 'var(--neon-cyan)' }}>{fileName}</span>
            </div>
            <span className="cyber-pill active">PHYSICAL STORAGE: LOCAL DISK</span>
          </div>

          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
              &gt; Reading encrypted sector from disk...
            </div>
          )}

          {error && (
            <div style={{ padding: '20px', color: 'var(--neon-rose)', background: 'rgba(255,0,85,0.1)', borderRadius: '8px' }}>
              Error reading ciphertext: {error}
            </div>
          )}

          {data && (
            <>
              {/* Entropy & Spec Cards */}
              <div className="hex-stats-grid">
                <div className="cyber-stat-box">
                  <span className="cyber-label">SHANNON ENTROPY</span>
                  <div className="cyber-val-big" style={{ color: 'var(--neon-emerald)' }}>
                    {data.shannonEntropy} / 8.00
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Max theoretical = 8.00 bits/byte (Indistinguishable from true white noise)
                  </span>
                </div>

                <div className="cyber-stat-box">
                  <span className="cyber-label">AES-GCM NONCE (12-BYTE IV)</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--neon-cyan)', marginTop: '4px', wordBreak: 'break-all' }}>
                    {data.ivBase64}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Guaranteed unique random initialization vector
                  </span>
                </div>

                <div className="cyber-stat-box">
                  <span className="cyber-label">CIPHERTEXT SIZE ON DISK</span>
                  <div className="cyber-val-big" style={{ color: '#fff' }}>
                    {data.encryptedSizeBytes} B
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Original payload: {data.originalFileSize} B (+16B GCM auth tag)
                  </span>
                </div>
              </div>

              {/* Hex View */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="cyber-label">RAW ENCRYPTED BYTES SAMPLE (FIRST 256 BYTES):</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Disk Path: {data.storagePath}
                  </span>
                </div>
                <div className="hex-display-terminal">
                  {formatHexDump(data.sampleHex).map((line, idx) => (
                    <div key={idx} className="hex-line">{line}</div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '14px', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Cryptographic Notice:</strong> Plaintext has been zeroized. Without obtaining at least 3 of the 5 Shamir polynomial shares to reconstruct the 256-bit AES master key, this ciphertext cannot be decrypted by any computational attack known today.
              </div>
            </>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Close Inspector</button>
          </div>
        </div>
      </div>
    </div>
  );
}
