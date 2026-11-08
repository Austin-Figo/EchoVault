import React, { useState, useEffect } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

const NODE_LABELS = {
  1: 'Node 1 (Alpha - Primary)',
  2: 'Node 2 (Beta - Secondary)',
  3: 'Node 3 (Gamma - Witness)',
  4: 'Node 4 (Delta - Replica A)',
  5: 'Node 5 (Epsilon - Replica B)',
};

export default function RecoveryLabModal({ file, onClose, showToast }) {
  const [selectedShares, setSelectedShares] = useState([1, 2, 3, 4, 5]);
  const [tamperIndex, setTamperIndex] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [logs, setLogs] = useState([
    { type: 'info', text: `Target Ciphertext: "${file.originalFileName}" (${file.fileSize} B)` },
    { type: 'info', text: '5 Shamir key shares partitioned across cluster nodes.' },
    { type: 'info', text: 'Configure active nodes or simulate tampering to test threshold recovery.' }
  ]);

  // Decrypted payload preview state
  const [recoveredPayload, setRecoveredPayload] = useState(null);
  // { url: string, text: string, type: string, size: number, name: string }

  const activeCount = selectedShares.length;
  const threshold = file.thresholdRequired || 3;
  const isThresholdMet = activeCount >= threshold;

  useEffect(() => {
    try { cyberAudio.playScan(); } catch {}
  }, []);

  const addLog = (type, text) => {
    setLogs((prev) => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  };

  const toggleShare = (idx) => {
    let next;
    if (selectedShares.includes(idx)) {
      next = selectedShares.filter((i) => i !== idx);
      if (tamperIndex === idx) setTamperIndex(null);
      cyberAudio.playBeep(380);
    } else {
      next = [...selectedShares, idx].sort();
      cyberAudio.playBeep(650);
    }
    setSelectedShares(next);

    if (next.length >= threshold && selectedShares.length < threshold) {
      cyberAudio.playLock();
    } else if (next.length < threshold && selectedShares.length >= threshold) {
      cyberAudio.playAlert();
    }
  };

  const applyPreset = (preset) => {
    if (preset === 'all5') {
      setSelectedShares([1, 2, 3, 4, 5]);
      setTamperIndex(null);
      cyberAudio.playLock();
      addLog('info', 'Preset applied: All 5 nodes active (100% redundancy).');
    } else if (preset === 'exact3') {
      setSelectedShares([1, 3, 5]);
      setTamperIndex(null);
      cyberAudio.playLock();
      addLog('warn', 'Preset applied: Exactly 3 nodes active [1, 3, 5] (Minimum threshold boundary).');
    } else if (preset === 'under2') {
      setSelectedShares([1, 2]);
      setTamperIndex(null);
      cyberAudio.playAlert();
      addLog('error', 'Preset applied: Only 2 nodes active [1, 2] (Under threshold - mathematically irrecoverable).');
    } else if (preset === 'tampered') {
      setSelectedShares([1, 2, 3]);
      setTamperIndex(2);
      cyberAudio.playAlert();
      addLog('error', 'Preset applied: 3 nodes active with Share #2 bit-flipped.');
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    cyberAudio.playBeep(520);
    addLog('info', `[TELEMETRY] Querying nodes: [${selectedShares.join(', ')}]...`);

    if (tamperIndex) {
      addLog('warn', `[CORRUPTION] Bit-flip injected into Share #${tamperIndex} payload.`);
    }

    try {
      const response = await fetch(`/api/files/${file.id}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeShareIndices: selectedShares,
          simulateOnly: true,
          tamperShareIndex: tamperIndex,
        }),
      });

      const data = await response.json();

      if (data.success) {
        cyberAudio.playDecrypted();
        addLog('success', `[SUCCESS] ${data.message}`);
        addLog('success', `Lagrange basis evaluated over GF(2^8). AES-GCM 128-bit tag verified. Decrypted payload length: ${data.fileSize} B.`);
        showToast('Cryptographic recovery verified!', 'success');
      } else {
        cyberAudio.playAlert();
        addLog('error', `[FAILED] ${data.message}`);
        if (!data.thresholdMet) {
          addLog('error', `Threshold deficient: Provided ${data.sharesUsed?.length || 0}/${data.thresholdRequired} required shares.`);
        } else if (!data.authenticationVerified) {
          addLog('error', 'AES-GCM authentication verification rejected: Invalid key or tampered ciphertext.');
        }
        showToast('Recovery verification rejected as expected', 'error');
      }
    } catch (err) {
      cyberAudio.playAlert();
      addLog('error', `[NETWORK ERROR] ${err.message}`);
      showToast('Simulation request error', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const executeRecoveryAndPreview = async (downloadDirect = false) => {
    if (!isThresholdMet) {
      cyberAudio.playAlert();
      showToast('Cannot recover: Threshold not met (< 3 shares)', 'error');
      addLog('error', `ABORTED: Cannot recover with only ${activeCount} shares. Minimum 3 required.`);
      return;
    }

    setIsRecovering(true);
    cyberAudio.playBeep(700);
    addLog('info', `[RECONSTRUCTION] Reconstructing AES key from nodes [${selectedShares.join(', ')}]...`);

    try {
      const response = await fetch(`/api/files/${file.id}/recover?inline=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeShareIndices: selectedShares,
          simulateOnly: false,
          tamperShareIndex: tamperIndex,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({ message: 'Recovery failed' }));
        throw new Error(errorJson.message || `Server responded with ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      cyberAudio.playDecrypted();
      addLog('success', `[AUTHENTICATED] Decryption completed. Payload: ${blob.size} bytes (${contentType}).`);

      if (downloadDirect) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.originalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Recovered and downloaded ${file.originalFileName}`, 'success');
      } else {
        // Prepare in-browser preview
        let textContent = null;
        const isText = contentType.startsWith('text/') ||
          contentType.includes('json') ||
          contentType.includes('javascript') ||
          contentType.includes('xml') ||
          file.originalFileName.match(/\.(txt|md|json|js|py|csv|html|xml|log|css|yaml|yml)$/i);

        if (isText && blob.size < 5000000) { // under 5MB text
          textContent = await blob.text();
        }

        setRecoveredPayload({
          url: blobUrl,
          text: textContent,
          type: contentType,
          size: blob.size,
          name: file.originalFileName
        });

        showToast(`Decrypted & authenticated ${file.originalFileName}!`, 'success');
      }
    } catch (err) {
      cyberAudio.playAlert();
      addLog('error', `[DECRYPTION FAILED] ${err.message}`);
      showToast(err.message, 'error');
    } finally {
      setIsRecovering(false);
    }
  };

  const isImage = recoveredPayload && (
    recoveredPayload.type.startsWith('image/') ||
    recoveredPayload.name.match(/\.(png|jpe?g|gif|webp|svg|bmp)$/i)
  );

  const isPdf = recoveredPayload && (
    recoveredPayload.type.includes('pdf') ||
    recoveredPayload.name.toLowerCase().endsWith('.pdf')
  );

  const isAudio = recoveredPayload && (
    recoveredPayload.type.startsWith('audio/') ||
    recoveredPayload.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
  );

  const isVideo = recoveredPayload && (
    recoveredPayload.type.startsWith('video/') ||
    recoveredPayload.name.match(/\.(mp4|webm|ogv|mov)$/i)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container cyber-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            THRESHOLD RECOVERY & PAYLOAD INSPECTOR
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Target File HUD */}
          <div className="cyber-hud-card" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="cyber-label">CIPHERTEXT OBJECT:</span>
                <span style={{ fontWeight: 700, marginLeft: '8px', color: 'var(--neon-cyan)', fontSize: '0.95rem' }}>
                  {file.originalFileName}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                  ({file.fileSize} Bytes)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="cyber-pill active">AES-256-GCM</span>
                <span className="cyber-pill active">SHAMIR 3-OF-5</span>
              </div>
            </div>
          </div>

          {/* Scenarios Preset Bar */}
          <div style={{ marginBottom: '16px' }}>
            <span className="cyber-label">QUICK SIMULATION SCENARIOS:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => applyPreset('all5')}>
                All 5 Nodes Online
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => applyPreset('exact3')}>
                Exact Threshold (Nodes 1, 3, 5)
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => applyPreset('under2')}>
                Fail: Only 2 Nodes (1, 2)
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => applyPreset('tampered')}>
                Tamper Attack: Share #2 Corrupted
              </button>
            </div>
          </div>

          {/* Interactive Node Selector */}
          <div style={{ marginBottom: '16px' }}>
            <span className="cyber-label">CLUSTER NODE SELECTION (CLICK TO TOGGLE):</span>
            <div className="shares-grid" style={{ marginTop: '6px' }}>
              {[1, 2, 3, 4, 5].map((idx) => {
                const isActive = selectedShares.includes(idx);
                const isTampered = tamperIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`share-toggle-card ${isActive ? 'active' : 'offline'} ${isTampered ? 'tampered' : ''}`}
                    onClick={() => toggleShare(idx)}
                  >
                    <div className="share-num" style={{ color: isActive ? 'var(--neon-cyan)' : 'var(--text-muted)' }}>
                      SHARE #{idx}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px', color: '#fff' }}>
                      {NODE_LABELS[idx].split(' ')[1]} {NODE_LABELS[idx].split(' ')[2]}
                    </div>
                    <div className="share-status-sub">
                      {isActive ? (
                        <span style={{ color: isTampered ? 'var(--neon-rose)' : 'var(--neon-emerald)', fontWeight: 700 }}>
                          {isTampered ? 'CORRUPTED' : '• ONLINE'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>• OFFLINE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tamper Injection Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', background: 'rgba(255, 0, 85, 0.08)', border: '1px solid rgba(255, 0, 85, 0.25)', padding: '10px 14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--neon-rose)', fontWeight: 700 }}>
              INJECT SHARE BIT-FLIP (TAMPER TEST):
            </span>
            <select
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
              value={tamperIndex || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                setTamperIndex(val);
                if (val) cyberAudio.playAlert();
              }}
            >
              <option value="">No Tampering (Cryptographically Pristine)</option>
              {selectedShares.map((idx) => (
                <option key={idx} value={idx}>Corrupt Share #{idx} Payload</option>
              ))}
            </select>
          </div>

          {/* Threshold Power Gauge */}
          <div className="threshold-meter-box">
            <div className="threshold-status-row">
              <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                CLUSTER ENERGY: {activeCount} / 5 SHARES ROUTED
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isThresholdMet ? 'var(--neon-emerald)' : 'var(--neon-rose)' }}>
                {isThresholdMet ? '✔ THRESHOLD ACQUIRED (≥ 3 REQ)' : '✖ INSUFFICIENT SHARES (< 3 REQ)'}
              </span>
            </div>
            <div className="threshold-gauge">
              <div
                className={`threshold-fill ${isThresholdMet ? 'safe' : 'danger'}`}
                style={{ width: `${(activeCount / 5) * 100}%` }}
              ></div>
              <div className="threshold-marker" title="Threshold Mark = 3"></div>
            </div>
          </div>

          {/* Recovery Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button
              className="btn btn-secondary"
              onClick={runSimulation}
              disabled={isSimulating || isRecovering}
            >
              {isSimulating ? 'Simulating Lagrange Reconstruction...' : 'Simulate Threshold Verification'}
            </button>

            <button
              className="btn btn-primary"
              onClick={() => executeRecoveryAndPreview(false)}
              disabled={isRecovering || !isThresholdMet}
              title={isThresholdMet ? 'Decrypt and inspect in browser' : 'Requires at least 3 shares'}
            >
              {isRecovering ? 'Decrypting AES-GCM Stream...' : 'Decrypt & Inspect Payload'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => executeRecoveryAndPreview(true)}
              disabled={isRecovering || !isThresholdMet}
              title="Download decrypted file directly"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
          </div>

          {/* IN-BROWSER DECRYPTED PAYLOAD VIEWER (WORKS FOR EVERY FILE) */}
          {recoveredPayload && (
            <div className="decrypted-preview-container" style={{ marginBottom: '20px' }}>
              <div className="section-header" style={{ marginBottom: '10px' }}>
                <span className="cyber-label" style={{ color: 'var(--neon-emerald)' }}>
                  ✔ DECRYPTED PLAINTEXT PREVIEW: {recoveredPayload.name}
                </span>
                <a
                  href={recoveredPayload.url}
                  download={recoveredPayload.name}
                  className="btn btn-primary btn-sm"
                >
                  Save to Disk ({recoveredPayload.size} B)
                </a>
              </div>

              {/* Image Preview */}
              {isImage && (
                <div className="preview-image-box">
                  <img src={recoveredPayload.url} alt="Decrypted Payload" className="decrypted-image" />
                </div>
              )}

              {/* Audio Preview */}
              {isAudio && (
                <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '10px' }}>
                  <audio controls src={recoveredPayload.url} style={{ width: '100%' }}></audio>
                </div>
              )}

              {/* Video Preview */}
              {isVideo && (
                <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden' }}>
                  <video controls src={recoveredPayload.url} style={{ maxWidth: '100%', maxHeight: '350px' }}></video>
                </div>
              )}

              {/* PDF Document Preview */}
              {isPdf && (
                <div style={{ background: '#020408', borderRadius: '10px', padding: '10px', border: '1px solid rgba(0,240,255,0.3)', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                      📄 EMBEDDED PDF DOCUMENT VIEWER
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Direct stream from decrypted memory blob
                    </span>
                  </div>
                  <iframe
                    src={recoveredPayload.url}
                    title="Decrypted PDF Document"
                    style={{ width: '100%', height: '440px', border: 'none', borderRadius: '6px', background: '#fff' }}
                  />
                </div>
              )}

              {/* Text / Code / JSON Preview */}
              {recoveredPayload.text && (
                <div className="code-preview-terminal">
                  <pre>{recoveredPayload.text}</pre>
                </div>
              )}

              {/* Generic Binary (ZIP, EXE, etc.) */}
              {!isImage && !isPdf && !isAudio && !isVideo && !recoveredPayload.text && (
                <div className="binary-preview-box">
                  <div style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--neon-cyan)' }}>
                    📦
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                    {recoveredPayload.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    MIME Type: {recoveredPayload.type} &bull; Decrypted Size: {recoveredPayload.size} Bytes
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--neon-emerald)', marginTop: '10px' }}>
                    Payload integrity authenticated via 128-bit GHASH tag. Ready for direct disk export.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Console */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span className="cyber-label">CRYPTOGRAPHIC AUDIT LOG:</span>
              <button className="close-btn" style={{ fontSize: '0.72rem' }} onClick={() => setLogs([])}>
                Clear Log
              </button>
            </div>
            <div className="console-box">
              {logs.map((l, index) => (
                <div key={index} className={`console-line console-${l.type}`}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>[{l.time || 'NOW'}]</span>
                  {l.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
