import React, { useState, useMemo } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function getExtColorClass(ext) {
  ext = (ext || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'badge-image';
  if (['txt', 'json', 'js', 'py', 'java', 'md', 'csv', 'html', 'xml'].includes(ext)) return 'badge-code';
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return 'badge-archive';
  if (['pdf', 'docx', 'xlsx', 'pptx'].includes(ext)) return 'badge-doc';
  if (['mp4', 'mp3', 'wav', 'mov', 'webm'].includes(ext)) return 'badge-media';
  return 'badge-bin';
}

function getCategory(ext) {
  ext = (ext || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'IMAGE';
  if (['txt', 'json', 'js', 'py', 'java', 'md', 'csv', 'html', 'xml'].includes(ext)) return 'CODE';
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return 'ARCHIVE';
  if (['pdf', 'docx', 'xlsx', 'pptx'].includes(ext)) return 'DOC';
  if (['mp4', 'mp3', 'wav', 'mov', 'webm'].includes(ext)) return 'MEDIA';
  return 'OTHER';
}

export default function FileTable({
  files,
  onOpenLab,
  onOpenHex,
  onQuickDownload,
  onDeleteFile,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const copyChecksum = (hash) => {
    navigator.clipboard.writeText(hash);
    cyberAudio.playBeep(900);
    showToast('SHA-256 Checksum copied to clipboard', 'info');
  };

  const filteredFiles = useMemo(() => {
    if (!Array.isArray(files)) return [];
    return files.filter((f) => {
      if (!f) return false;
      const fileName = f.originalFileName || 'unknown';
      const ext = (fileName.split('.').pop() || '').toUpperCase();
      const cat = getCategory(ext);

      const matchesCat = activeCategory === 'ALL' ||
        (activeCategory === 'DOC' && cat === 'DOC') ||
        (activeCategory === 'IMAGE' && cat === 'IMAGE') ||
        (activeCategory === 'CODE' && cat === 'CODE') ||
        (activeCategory === 'ARCHIVE' && cat === 'ARCHIVE') ||
        (activeCategory === 'MEDIA' && cat === 'MEDIA');

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        fileName.toLowerCase().includes(q) ||
        (f.checksumSha256 && f.checksumSha256.toLowerCase().includes(q)) ||
        (f.contentType && f.contentType.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [files, searchQuery, activeCategory]);

  return (
    <div className="section-container cyber-table-card">
      <div className="section-header">
        <div>
          <div className="cyber-tag-sub">IMMUTABLE CYPHER-LEDGER</div>
          <h2 className="section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Encrypted Vault Ledger ({files.length} Records)
          </h2>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          AES-256-GCM CIPHERTEXTS &bull; 3-OF-5 RECOVERY QUORUM
        </span>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'DOC', 'IMAGE', 'CODE', 'ARCHIVE', 'MEDIA'].map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                cyberAudio.playBeep(650);
                setActiveCategory(cat);
              }}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search by name, hash, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '6px 12px 6px 32px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            style={{ position: 'absolute', left: '10px', top: '9px' }}
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
          <p style={{ marginBottom: '4px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            NO MATCHING VAULT OBJECTS
          </p>
          <p style={{ fontSize: '0.8rem' }}>
            {files.length === 0
              ? 'Transmit any file into the gateway above to generate a 256-bit AES key and Shamir shares.'
              : 'Try clearing your search query or format filter.'}
          </p>
        </div>
      ) : (
        <div className="file-table-wrapper">
          <table className="file-table">
            <thead>
              <tr>
                <th>Payload Object</th>
                <th>Format</th>
                <th>Ciphertext Size</th>
                <th>Ingested (UTC)</th>
                <th>SHA-256 Authenticity Hash</th>
                <th>Threshold Quorum</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const fileName = file?.originalFileName || 'unknown.bin';
                const ext = (fileName.split('.').pop() || 'BIN').toUpperCase();
                const extClass = getExtColorClass(ext);

                return (
                  <tr key={file.id}>
                    <td>
                      <div className="file-name-cell">
                        <span className={`file-ext-badge ${extClass}`}>{ext}</span>
                        <span title={fileName} style={{ color: '#fff', fontWeight: 600 }}>
                          {fileName}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {file.contentType || 'application/octet-stream'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>
                      {formatBytes(file.fileSize)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {formatDate(file.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="hash-cell">
                          {file.checksumSha256
                            ? `${file.checksumSha256.substring(0, 10)}...${file.checksumSha256.substring(file.checksumSha256.length - 8)}`
                            : 'N/A'}
                        </span>
                        {file.checksumSha256 && (
                          <button
                            className="close-btn"
                            title="Copy Full Checksum"
                            onClick={() => copyChecksum(file.checksumSha256)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="shares-pill healthy">
                        <span className="pulse-dot"></span>
                        {file.shares ? `${file.shares.length}/5 SHARES ACTIVE` : '5/5 SHARES'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                        {/* Recovery Lab */}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            cyberAudio.playBeep(750);
                            onOpenLab(file);
                          }}
                          title="Open Recovery & Threshold Lab"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                            <polyline points="2 17 12 22 22 17"/>
                            <polyline points="2 12 12 17 22 12"/>
                          </svg>
                          Recovery Lab
                        </button>

                        {/* Raw Hex Telemetry */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            cyberAudio.playBeep(550);
                            onOpenHex(file);
                          }}
                          title="Inspect raw encrypted ciphertext & Shannon entropy"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                          </svg>
                          Hex
                        </button>

                        {/* Quick Download */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            cyberAudio.playBeep(650);
                            onQuickDownload(file);
                          }}
                          title="Decrypt with all 5 nodes & download"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            cyberAudio.playAlert();
                            onDeleteFile(file.id, file.originalFileName);
                          }}
                          title="Purge ciphertext and all shares"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
