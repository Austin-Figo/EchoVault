import React, { useState, useRef } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function FileUpload({ onUploadSuccess, showToast }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [lastUploaded, setLastUploaded] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragOver(true);
    } else if (e.type === 'dragleave') {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setSelectedFile(f);
      cyberAudio.playBeep(600);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      cyberAudio.playBeep(600);
    }
  };

  const executeUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStage('Executing AES-256-GCM encryption & Shamir (3-of-5) polynomial split...');
    try { cyberAudio.playScan(); } catch {}

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      setLastUploaded(result);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      try { cyberAudio.playLock(); } catch {}
      showToast(`Encrypted ${result.fileName} & partitioned across 5 threshold nodes`, 'success');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      try { cyberAudio.playAlert(); } catch {}
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setUploading(false);
      setUploadStage('');
    }
  };

  return (
    <div className="section-container cyber-upload-card">
      <div className="section-header">
        <div>
          <div className="cyber-tag-sub">SECURE INGESTION GATEWAY</div>
          <h2 className="section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Threshold Ingestion & Zero-Knowledge Encryption
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="cyber-pill active">MAX SIZE: 250 MB</span>
          <span className="cyber-pill active">ALL FILE FORMATS</span>
        </div>
      </div>

      <div
        className={`cyber-dropzone ${dragOver ? 'dragging' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Futuristic Target Reticle */}
        <div className="reticle-box">
          <div className="reticle-corner tl"></div>
          <div className="reticle-corner tr"></div>
          <div className="reticle-corner bl"></div>
          <div className="reticle-corner br"></div>

          <div className="upload-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <circle cx="12" cy="11" r="3"/>
            </svg>
          </div>
        </div>

        <p className="upload-text-main">
          {selectedFile ? (
            <span style={{ color: 'var(--neon-cyan)', textShadow: '0 0 10px rgba(0,240,255,0.6)' }}>
              TARGET READY: {selectedFile.name} [{formatBytes(selectedFile.size)}]
            </span>
          ) : (
            'TRANSMIT FILE TO CYPHER-VAULT (DRAG & DROP OR BROWSE)'
          )}
        </p>
        <p className="upload-text-sub">
          Accepts any file: images, video, documents, code, archives, or binaries. Encrypted with AES-256-GCM & partitioned into 5 Shamir shares.
        </p>
      </div>

      {selectedFile && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={executeUpload}
            disabled={uploading}
          >
            {uploading ? 'ENCRYPTING & DISTRIBUTING...' : 'ENCRYPT & COMMIT TO VAULT'}
          </button>
        </div>
      )}

      {uploading && (
        <div className="cyber-progress-box">
          <div className="cyber-pulse-dot" style={{ background: 'var(--neon-cyan)' }}></div>
          <span>{uploadStage}</span>
        </div>
      )}

      {lastUploaded && !uploading && (
        <div className="upload-success-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, color: 'var(--neon-emerald)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
              ✔ INGESTION COMPLETE: {lastUploaded.fileName}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Threshold: {lastUploaded.recoveryThreshold}-of-{lastUploaded.totalSharesGenerated} Shares Required
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {lastUploaded.shares?.map((s) => (
              <span key={s.shareIndex} className="shares-pill healthy">
                Share #{s.shareIndex} &rarr; {s.nodeName.split(' ')[0]} {s.nodeName.split(' ')[1]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
