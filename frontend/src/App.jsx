import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import NetworkTopology from './components/NetworkTopology';
import FileUpload from './components/FileUpload';
import FileTable from './components/FileTable';
import RecoveryLabModal from './components/RecoveryLabModal';
import HexInspectorModal from './components/HexInspectorModal';
import CryptographicLab from './components/CryptographicLab';
import SystemDiagnostics from './components/SystemDiagnostics';
import VaultSettings from './components/VaultSettings';
import VivaTourModal from './components/VivaTourModal';
import Toast from './components/Toast';
import { cyberAudio } from './utils/cyberAudio';

/* ── Error Boundary: shows a friendly error panel instead of blank page ── */
class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(err, info) {
    console.error('EchoVault Tab Error:', err, info);
  }
  componentDidUpdate(prevProps) {
    // Reset error when tab changes
    if (prevProps.tabId !== this.props.tabId) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          background: 'rgba(255,0,85,0.06)',
          border: '1px solid rgba(255,0,85,0.3)',
          borderRadius: '16px',
          textAlign: 'center',
          margin: '20px 0',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠</div>
          <div style={{ fontWeight: 800, color: 'var(--neon-rose)', fontFamily: 'var(--font-mono)', marginBottom: '8px', fontSize: '1rem' }}>
            TAB RENDER ERROR
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '520px', margin: '0 auto 16px' }}>
            {this.state.error?.message || 'Unknown render error'}
          </div>
          <button
            style={{ background: 'rgba(255,0,85,0.15)', border: '1px solid rgba(255,0,85,0.4)', color: 'var(--neon-rose)', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Sidebar nav config ── */
const NAV_ITEMS = [
  {
    id: 'files',
    label: 'Cypher Ledger',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    id: 'topology',
    label: 'Orbital Topology',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <circle cx="12" cy="3" r="2"/>
        <circle cx="21" cy="9" r="2"/>
        <circle cx="19" cy="19" r="2"/>
        <circle cx="5" cy="19" r="2"/>
        <circle cx="3" cy="9" r="2"/>
      </svg>
    ),
  },
  {
    id: 'architecture',
    label: 'GF(2\u2078) Math Lab',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
  },
  {
    id: 'health',
    label: 'System Diagnostics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Vault Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  },
];

/* ── Main App Component ── */
export default function App() {
  const [activeTab, setActiveTab] = useState('files');
  const [health, setHealth] = useState(null);
  const [files, setFiles] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeLabFile, setActiveLabFile] = useState(null);
  const [hexTargetFile, setHexTargetFile] = useState(null);
  const [activeClusterNodes, setActiveClusterNodes] = useState([1, 2, 3, 4, 5]);
  const [toasts, setToasts] = useState([]);
  const [showVivaTour, setShowVivaTour] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) setHealth(await res.json());
    } catch { /* backend not ready yet */ }
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      if (res.ok) setFiles(await res.json());
    } catch { /* backend not ready yet */ }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { cyberAudio.playBeep(620); } catch {}
    await Promise.all([fetchHealth(), fetchFiles()]);
    setIsRefreshing(false);
    showToast('Vault cluster telemetry synchronized', 'info');
  }, [fetchHealth, fetchFiles, showToast]);

  useEffect(() => {
    fetchHealth();
    fetchFiles();
    const id = setInterval(() => { fetchHealth(); fetchFiles(); }, 10000);
    return () => clearInterval(id);
  }, [fetchHealth, fetchFiles]);

  const switchTab = useCallback((tabId) => {
    try { cyberAudio.playBeep(700); } catch {}
    setActiveTab(tabId);
  }, []);

  const toggleClusterNode = useCallback((nodeId) => {
    setActiveClusterNodes(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId].sort()
    );
  }, []);

  const handleQuickDownload = useCallback(async (file) => {
    showToast(`Decrypting ${file.originalFileName}…`, 'info');
    try {
      const resp = await fetch(`/api/files/${file.id}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeShareIndices: activeClusterNodes.length >= 3 ? activeClusterNodes : [1, 2, 3, 4, 5],
          simulateOnly: false,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: 'Decryption failed' }));
        throw new Error(err.message || 'Decryption failed');
      }
      try { cyberAudio.playDecrypted(); } catch {}
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: file.originalFileName });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Extracted: ${file.originalFileName}`, 'success');
    } catch (err) {
      try { cyberAudio.playAlert(); } catch {}
      showToast(err.message, 'error');
    }
  }, [activeClusterNodes, showToast]);

  const handleDeleteFile = useCallback(async (id, fileName) => {
    if (!window.confirm(`CONFIRM PURGE: Permanently erase "${fileName}" and all 5 Shamir shares?`)) return;
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Purged: ${fileName}`, 'success');
        fetchFiles();
        fetchHealth();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Purge failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [fetchFiles, fetchHealth, showToast]);

  return (
    <div className="app-container">
      {/* Scanline overlay — pointer-events disabled so it never blocks clicks */}
      <div className="cyber-scanlines" />

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div className="brand-title">ECHOVAULT</div>
            <div className="brand-subtitle">CYPHER-CORE 3-OF-5</div>
          </div>
        </div>

        <nav className="nav-links">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              className={'nav-item' + (activeTab === item.id ? ' active' : '')}
              onClick={() => switchTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="cyber-label">STORAGE ENGINE</div>
          <div style={{ color: 'var(--neon-cyan)', marginTop: '4px', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            {health?.activeDatabase || 'H2 Persistent Vault'}
          </div>
          <div className="system-badge" style={{ marginTop: '10px' }}>
            <span className="pulse-dot" />
            DEFENSE LEVEL: MAXIMUM
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Navbar health={health} onRefresh={handleRefresh} isRefreshing={isRefreshing} onOpenVivaTour={() => setShowVivaTour(true)} />

        <StatsCards
          health={health}
          filesCount={files.length}
          activeNodesCount={activeClusterNodes.length}
        />

        {/* Tab 1: Cypher Ledger */}
        {activeTab === 'files' && (
          <TabErrorBoundary tabId="files">
            <FileUpload
              onUploadSuccess={() => { fetchFiles(); fetchHealth(); }}
              showToast={showToast}
            />
            <FileTable
              files={files}
              onOpenLab={file => setActiveLabFile(file)}
              onOpenHex={file => setHexTargetFile(file)}
              onQuickDownload={handleQuickDownload}
              onDeleteFile={handleDeleteFile}
              showToast={showToast}
            />
          </TabErrorBoundary>
        )}

        {/* Tab 2: Orbital Topology */}
        {activeTab === 'topology' && (
          <TabErrorBoundary tabId="topology">
            <NetworkTopology
              activeNodes={activeClusterNodes}
              onToggleNode={toggleClusterNode}
              fileCount={files.length}
              thresholdRequired={health?.thresholdRequired || 3}
            />
          </TabErrorBoundary>
        )}

        {/* Tab 3: GF(2⁸) Math Lab */}
        {activeTab === 'architecture' && (
          <TabErrorBoundary tabId="architecture">
            <CryptographicLab />
          </TabErrorBoundary>
        )}

        {/* Tab 4: System Diagnostics */}
        {activeTab === 'health' && (
          <TabErrorBoundary tabId="health">
            <SystemDiagnostics
              health={health}
              filesCount={files.length}
              onRefresh={handleRefresh}
            />
          </TabErrorBoundary>
        )}

        {/* Tab 5: Vault Settings */}
        {activeTab === 'settings' && (
          <TabErrorBoundary tabId="settings">
            <VaultSettings
              health={health}
              files={files}
              onRefreshAll={() => { fetchFiles(); fetchHealth(); }}
              showToast={showToast}
            />
          </TabErrorBoundary>
        )}
      </main>

      {/* ── Modals ── */}
      {showVivaTour && (
        <VivaTourModal onClose={() => setShowVivaTour(false)} />
      )}
      {activeLabFile && (
        <RecoveryLabModal
          file={activeLabFile}
          onClose={() => setActiveLabFile(null)}
          showToast={showToast}
        />
      )}
      {hexTargetFile && (
        <HexInspectorModal
          fileId={hexTargetFile.id}
          fileName={hexTargetFile.originalFileName}
          onClose={() => setHexTargetFile(null)}
        />
      )}

      {/* ── Toasts ── */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
