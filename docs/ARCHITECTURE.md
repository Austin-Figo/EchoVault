# EchoVault Architecture & Cryptographic Design

## Overview

EchoVault is a secure data storage system designed around two foundational cryptographic principles:
1. **Authenticated Encryption with Associated Data (AEAD)** via AES-256-GCM.
2. **Threshold Cryptography** via Shamir's Secret Sharing Scheme ($k = 3, n = 5$) implemented over the finite Galois Field $\text{GF}(2^8)$.

The system demonstrates how confidential files can be encrypted locally and their recovery keys distributed across multiple simulated storage nodes such that no single node—and no coalition of fewer than 3 nodes—can reconstruct the key.

---

## 1. Cryptographic Pipeline

```
+-----------------------------------------------------------------------------------+
|                               FILE INGESTION FLOW                                 |
+-----------------------------------------------------------------------------------+
                                        |
                             [ Upload Plaintext File ]
                                        |
                     +-------------------------------------+
                     | Generate Random 256-bit AES Key (K) |
                     | Generate Random 96-bit Nonce/IV     |
                     +-------------------------------------+
                                        |
                     +-------------------------------------+
                     | Encrypt File: AES-256-GCM(K, IV)    |
                     | Compute SHA-256 Checksum            |
                     +-------------------------------------+
                                        |
                        +---------------+---------------+
                        |                               |
       [ Save Encrypted Ciphertext ]       [ Shamir 3-of-5 Split ]
             to Local Disk:                 over GF(2^8) on Key K
           storage/{uuid}.enc                           |
                                            +-----------+-----------+
                                            |   Generate 5 Shares   |
                                            | (Index 1..5, 32 bytes)|
                                            +-----------+-----------+
                                                        |
                                            [ Securely Wipe Key K ]
                                                        |
                                            [ Persist Shares in DB ]
                                            (H2 / KeyShare entity)
```

### 1.1 Authenticated Encryption (AES-256-GCM)
- **Key Generation:** 256-bit (32-byte) pseudo-random key generated via `SecureRandom`.
- **Initialization Vector:** 96-bit (12-byte) unique random nonce generated per encryption operation.
- **Cipher Mode:** `AES/GCM/NoPadding` with a 128-bit authentication tag.
- **Authentication Guarantee:** Detects unauthorized alteration of the ciphertext. If any byte is modified, or if an incorrect key is provided during decryption, Java's cryptography provider throws `AEADBadTagException`.

### 1.2 Shamir's Secret Sharing over $\text{GF}(2^8)$
- **Finite Field:** Rijndael field $\mathbb{F}_{2^8} \cong \mathbb{F}_2[x] / (x^8 + x^4 + x^3 + x + 1)$ (irreducible polynomial `0x11B`).
- **Polynomial Formulation:**
  For each byte $b \in \{0, \dots, 31\}$ of the AES key $K$:
  $$P_b(x) = K_b \oplus a_{1,b} x \oplus a_{2,b} x^2$$
  where $a_{1,b}, a_{2,b} \xleftarrow{\text{R}} \text{GF}(2^8)$ are selected via `SecureRandom`.
- **Evaluation:**
  Shares are evaluated at non-zero points $x \in \{1, 2, 3, 4, 5\}$.
- **Reconstruction:**
  Given any $k \ge 3$ distinct points $(x_i, y_{i,b})$, the constant term $P_b(0) = K_b$ is reconstructed using Lagrange interpolation:
  $$K_b = \bigoplus_{i=1}^k \left( y_{i,b} \cdot \ell_i(0) \right)$$
  where
  $$\ell_i(0) = \prod_{j \neq i} \frac{x_j}{x_i \oplus x_j}$$

---

## 2. Storage & Node Model

- **Encrypted Blob Storage:** Files are stored in the local `./storage/` folder with safe randomized UUID filenames. Path traversal protection ensures files cannot escape the designated storage root.
- **Database Storage:** File metadata (filename, size, MIME type, SHA-256 hash, GCM IV) and the 5 key shares are persisted in an embedded file-based H2 database (`./data/echovault.mv.db`).
- **Zero-Knowledge Key Storage:** The plaintext 256-bit AES key is never written to disk, database, or logs. It is zeroized in memory immediately following the Shamir split.

---

## 3. Threat Model & Safeguards

| Threat | Safeguard |
|---|---|
| Single node compromise | Attacker obtains only 1 share (32 bytes), providing 0 bits of information about the AES key. |
| Two node collusions | 2 shares cannot reconstruct a degree-2 polynomial; all 256 possible byte values remain equally likely. |
| Ciphertext tampering | 128-bit AES-GCM authentication tag verification rejects corrupted data (`AEADBadTagException`). |
| Share corruption / bit-flip | Corrupted share yields an incorrect reconstructed key, which fails AES-GCM tag verification. |
| Path traversal attack | File names are sanitized and verified against the base storage boundary. |
| Information leakage in logs | Keys, share payloads, and plaintext bytes are strictly excluded from logging. |
