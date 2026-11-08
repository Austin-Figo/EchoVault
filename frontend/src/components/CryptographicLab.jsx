import React, { useState } from 'react';
import { cyberAudio } from '../utils/cyberAudio';

function gfAdd(a, b) {
  return (a ^ b) & 0xff;
}

function gfMul(a, b) {
  let p = 0;
  a &= 0xff;
  b &= 0xff;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b; // 0x11B irreducible polynomial
    b >>= 1;
  }
  return p & 0xff;
}

function gfInv(a) {
  a &= 0xff;
  if (a === 0) return 0;
  let res = 1;
  let base = a;
  // Fermat's Little Theorem: a^254 in GF(2^8) is inverse
  let exp = 254;
  while (exp > 0) {
    if (exp % 2 === 1) res = gfMul(res, base);
    base = gfMul(base, base);
    exp = Math.floor(exp / 2);
  }
  return res;
}

export default function CryptographicLab() {
  const [valA, setValA] = useState(87); // 0x57
  const [valB, setValB] = useState(131); // 0x83

  const sum = gfAdd(valA, valB);
  const prod = gfMul(valA, valB);
  const invA = gfInv(valA);
  const invB = gfInv(valB);

  return (
    <div className="section-container cyber-card">
      <div className="section-header">
        <div>
          <div className="cyber-tag-sub">THEORETICAL CRYPTOGRAPHY ENGINE</div>
          <h2 className="section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            Finite Galois Field GF(2⁸) & Lagrange Interpolator
          </h2>
        </div>
        <span className="cyber-pill active">IRREDUCIBLE POLYNOMIAL: 0x11B</span>
      </div>

      <div style={{ lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        EchoVault executes Shamir's Secret Sharing byte-by-byte over the Rijndael Galois Field GF(2<sup>8</sup>) &cong; GF(2)[x] / (x<sup>8</sup> + x<sup>4</sup> + x<sup>3</sup> + x + 1).
        Because every non-zero element has a unique multiplicative inverse, Lagrange interpolation reconstructs the exact secret with zero rounding error.
      </div>

      {/* Interactive Field Arithmetic Calculator */}
      <div className="cyber-hud-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <span className="cyber-label" style={{ color: 'var(--neon-cyan)', marginBottom: '12px', display: 'block' }}>
          INTERACTIVE GF(2⁸) FIELD CALCULATOR:
        </span>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ELEMENT A (0–255):
            </label>
            <input
              type="number"
              min="0"
              max="255"
              value={valA}
              onChange={(e) => {
                cyberAudio.playBeep(500);
                setValA(Math.max(0, Math.min(255, parseInt(e.target.value) || 0)));
              }}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--neon-cyan)', padding: '8px 12px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '1rem', width: '130px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
              (0x{valA.toString(16).toUpperCase().padStart(2, '0')})
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ELEMENT B (0–255):
            </label>
            <input
              type="number"
              min="0"
              max="255"
              value={valB}
              onChange={(e) => {
                cyberAudio.playBeep(600);
                setValB(Math.max(0, Math.min(255, parseInt(e.target.value) || 0)));
              }}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--neon-cyan)', padding: '8px 12px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '1rem', width: '130px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
              (0x{valB.toString(16).toUpperCase().padStart(2, '0')})
            </span>
          </div>
        </div>

        {/* Results Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div className="cyber-stat-box">
            <span className="cyber-label">FIELD ADDITION (A ⊕ B):</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-emerald)' }}>
              {sum} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(0x{sum.toString(16).toUpperCase().padStart(2, '0')})</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Identical to bitwise XOR</span>
          </div>

          <div className="cyber-stat-box">
            <span className="cyber-label">FIELD MULTIPLICATION (A ⊗ B):</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-cyan)' }}>
              {prod} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(0x{prod.toString(16).toUpperCase().padStart(2, '0')})</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modulo x⁸ + x⁴ + x³ + x + 1</span>
          </div>

          <div className="cyber-stat-box">
            <span className="cyber-label">MULTIPLICATIVE INVERSE (A⁻¹):</span>
            <div className="cyber-val-big" style={{ color: 'var(--neon-amber)' }}>
              {invA} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(0x{invA.toString(16).toUpperCase().padStart(2, '0')})</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>A ⊗ A⁻¹ = {gfMul(valA, invA)}</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="cyber-stat-box">
          <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
            1. Authenticated Encryption (AES-GCM)
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Counter-mode stream encryption paired with a 128-bit GHASH authentication tag. Protects against bit-flipping, padding oracle attacks, and chosen-ciphertext tampering.
          </p>
        </div>

        <div className="cyber-stat-box">
          <h4 style={{ color: 'var(--neon-emerald)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
            2. Shamir 3-of-5 Polynomial Threshold
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Constructs independent degree-2 polynomials for each of the 32 key bytes. Any 3 points resolve the constant term K. Any 2 points leave all 256 candidates equally probable.
          </p>
        </div>

        <div className="cyber-stat-box">
          <h4 style={{ color: 'var(--neon-rose)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
            3. Zero-Knowledge Key Storage
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            The 256-bit AES master key exists in RAM only during initial polynomial evaluation. Plaintext bytes are wiped from memory immediately after share distribution.
          </p>
        </div>
      </div>
    </div>
  );
}
