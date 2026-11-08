import React, { useState } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

const STEPS = [
  {
    title: '1. The Problem: Key Vulnerability & Single Points of Failure',
    tag: 'FOUNDATIONAL SECURITY THREAT',
    content: (
      <div>
        <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
          In traditional encrypted cloud storage, the encryption key is either:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <li><strong>Stored with the cloud provider:</strong> Vulnerable to insider threats, subpoena, and server compromise.</li>
          <li><strong>Retained exclusively by the client:</strong> If lost, data is permanently destroyed with zero recovery recourse.</li>
        </ul>
        <div style={{ background: 'rgba(0, 240, 255, 0.08)', border: '1px solid var(--neon-cyan)', borderRadius: '8px', padding: '12px 16px', fontSize: '0.85rem' }}>
          <strong style={{ color: 'var(--neon-cyan)' }}>EchoVault's Solution:</strong> Threshold Cryptography. Instead of trusting one server or risking single-key loss, the AES-256 key is partitioned across five independent nodes using a <strong>3-of-5 threshold</strong> scheme.
        </div>
      </div>
    )
  },
  {
    title: '2. Ingestion & Zero-Knowledge Encryption Pipeline',
    tag: 'CRYPTOGRAPHIC SPECIFICATIONS',
    content: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div className="cyber-stat-box">
            <span className="cyber-label">CIPHER</span>
            <div style={{ color: 'var(--neon-cyan)', fontWeight: 800, marginTop: '4px' }}>AES-256-GCM</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Galois/Counter Mode (authenticated)</span>
          </div>
          <div className="cyber-stat-box">
            <span className="cyber-label">NONCE (IV)</span>
            <div style={{ color: 'var(--neon-emerald)', fontWeight: 800, marginTop: '4px' }}>96-bit SecureRandom</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Guaranteed unique per file</span>
          </div>
          <div className="cyber-stat-box">
            <span className="cyber-label">AUTH TAG</span>
            <div style={{ color: 'var(--neon-amber)', fontWeight: 800, marginTop: '4px' }}>128-bit GHASH</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rejects bit-flipped ciphertexts</span>
          </div>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong>Zero-Knowledge Memory Sanitization:</strong> The 256-bit AES master key exists in RAM only during polynomial evaluation. Immediately upon generating the 5 Shamir shares, the raw key array in memory is explicitly zeroized (<code>Arrays.fill(key, (byte) 0)</code>). The plaintext key is <strong>never persisted to disk or database</strong>.
        </p>
      </div>
    )
  },
  {
    title: "3. Shamir's Secret Sharing over Galois Field GF(2⁸)",
    tag: 'MATHEMATICAL PROOF & RIGOR',
    content: (
      <div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.7 }}>
          Unlike insecure XOR splits or naive duplication, EchoVault evaluates independent degree-2 polynomials for each of the 32 key bytes:
        </p>
        <div style={{ background: '#020408', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--neon-emerald)', textAlign: 'center', marginBottom: '14px' }}>
          P(x) = a₀ + a₁·x + a₂·x² &nbsp; (mod x⁸ + x⁴ + x³ + x + 1)
        </div>
        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.8 }}>
          <li><strong>Constant term a₀:</strong> The secret key byte. Evaluated at evaluation points x &isin; {'{1, 2, 3, 4, 5}'}.</li>
          <li><strong>Random coefficients a₁, a₂:</strong> Sampled uniformly from GF(2⁸) using <code>SecureRandom</code>.</li>
          <li><strong>Lagrange Interpolation:</strong> Any 3 points (x_i, y_i) uniquely solve the quadratic curve at x=0. Any 2 points leave all 256 candidates equally probable &mdash; providing <em>information-theoretic security</em>.</li>
        </ul>
      </div>
    )
  },
  {
    title: '4. Attack Immunity & Tamper Resistance',
    tag: 'SECURITY VERIFICATION',
    content: (
      <div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.7 }}>
          What happens when an attacker compromises a storage node or alters a share in transit?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: 'rgba(255, 0, 85, 0.08)', border: '1px solid rgba(255, 0, 85, 0.3)', borderRadius: '8px', padding: '12px 14px' }}>
            <strong style={{ color: 'var(--neon-rose)', fontSize: '0.85rem' }}>Attack Scenario: Share Bit-Flipping</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              If Node 2's share is corrupted, Lagrange interpolation will calculate an invalid candidate key. Because AES-GCM enforces a 128-bit GHASH authentication tag, decryption immediately aborts with <code>AEADBadTagException</code>.
            </p>
          </div>
          <div style={{ background: 'rgba(0, 255, 157, 0.08)', border: '1px solid rgba(0, 255, 157, 0.3)', borderRadius: '8px', padding: '12px 14px' }}>
            <strong style={{ color: 'var(--neon-emerald)', fontSize: '0.85rem' }}>Core Guarantee: Zero Corrupted Plaintext</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              EchoVault will strictly reject invalid recovery requests rather than return garbage plaintext.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: '5. Examiner Live Demonstration Checklist',
    tag: 'HANDS-ON VIVA DEMO',
    content: (
      <div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Use this exact sequence to demonstrate EchoVault's capabilities to examiners or team members:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(10, 15, 26, 0.6)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--neon-cyan)', marginRight: '8px' }}>[STEP 1]</span>
            Upload any PDF, image, or audio file in <strong>Cypher Ledger</strong>. Point out the instant 4-stage pipeline.
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(10, 15, 26, 0.6)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--neon-cyan)', marginRight: '8px' }}>[STEP 2]</span>
            Click <strong>Hex</strong> to inspect the raw ciphertext and verify Shannon entropy is ~7.99 / 8.00 bits/byte (indistinguishable from white noise).
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(10, 15, 26, 0.6)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--neon-cyan)', marginRight: '8px' }}>[STEP 3]</span>
            Open <strong>Recovery Lab</strong>: apply preset <em>"Exact Threshold (Nodes 1, 3, 5)"</em> &rarr; Decrypt & inspect payload in-browser.
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(10, 15, 26, 0.6)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--neon-rose)', marginRight: '8px' }}>[STEP 4]</span>
            Apply preset <em>"Fail: Only 2 Nodes"</em> &rarr; Verify rejection (&lt;3 shares).
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(10, 15, 26, 0.6)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--neon-rose)', marginRight: '8px' }}>[STEP 5]</span>
            Apply preset <em>"Tamper Attack: Share #2 Corrupted"</em> &rarr; Verify AES-GCM GHASH authentication tag rejection.
          </div>
        </div>
      </div>
    )
  }
];

export default function VivaTourModal({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      try { cyberAudio.playBeep(700); } catch {}
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      try { cyberAudio.playBeep(500); } catch {}
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container cyber-modal" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            VIVA &amp; TECHNICAL ARCHITECTURE WALKTHROUGH
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span className="cyber-tag-sub" style={{ color: 'var(--neon-cyan)' }}>{step.tag}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              MODULE {currentStep + 1} OF {STEPS.length}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                onClick={() => {
                  try { cyberAudio.playBeep(600); } catch {}
                  setCurrentStep(idx);
                }}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: idx === currentStep ? 'var(--neon-cyan)' : idx < currentStep ? 'var(--neon-emerald)' : 'rgba(255,255,255,0.1)',
                  boxShadow: idx === currentStep ? '0 0 8px var(--neon-cyan)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>

          <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
            {step.title}
          </h3>

          <div style={{ minHeight: '260px' }}>
            {step.content}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              &larr; Previous Module
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Exit Walkthrough
              </button>
              {currentStep < STEPS.length - 1 ? (
                <button className="btn btn-primary btn-sm" onClick={nextStep}>
                  Next Module &rarr;
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={onClose}>
                  Complete Walkthrough &check;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
