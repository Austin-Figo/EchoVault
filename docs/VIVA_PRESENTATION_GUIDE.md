# EchoVault — Viva Defense, Examiner Q&A, and Presentation Guide

**Project Title:** EchoVault — Secure Distributed Data Storage Using Encryption and Threshold-Based Recovery  
**Stack:** Java 21, Spring Boot 3.3.4, React + Vite, H2 / MySQL, AES-256-GCM, GF(2⁸) Shamir Secret Sharing

---

## 1. Two-Minute Executive Pitch

> "Traditional cloud and distributed storage architectures rely on centralized master keys or single points of trust. If a master key is compromised or a storage node is breached, confidential data is irrevocably exposed.
>
> **EchoVault solves this by merging Authenticated Encryption (AES-256-GCM) with Threshold Cryptography (Shamir's Secret Sharing Scheme over $\text{GF}(2^8)$).**
>
> When any file is uploaded, EchoVault generates a unique 256-bit AES key and a 96-bit random nonce. The file is encrypted with AES-GCM and stored as an encrypted blob. The AES master key is then split into **5 shares** using a degree-2 polynomial over the Galois Field $\text{GF}(2^8)$ with a threshold of **$k = 3$**. Crucially, the original AES key is **wiped from memory immediately**.
>
> To recover the file, any **3 of the 5 nodes** can mathematically reconstruct the key via Lagrange interpolation. Any 2 or fewer nodes convey **zero mathematical information** about the key. If an adversary attempts to modify the ciphertext or tamper with any share, AES-GCM's 128-bit GHASH authentication tag instantly rejects the operation.
>
> EchoVault provides an interactive, futuristic cyber dashboard featuring real-time orbital topology mapping, raw ciphertext Shannon entropy analysis, multi-format in-browser payload inspection, and live tamper simulation."

---

## 2. Core Cryptographic Foundations

### A. Why AES-256-GCM (and Not CBC or ECB)?
1. **Authenticated Encryption with Associated Data (AEAD):** Unlike CBC (which only provides confidentiality and requires an external HMAC to prevent padding oracle attacks), GCM provides simultaneous **confidentiality and integrity** via a 128-bit Galois Authentication Tag (GHASH).
2. **Zero Padding Oracle Risk:** GCM operates in counter mode (CTR) with authentication, completely eliminating CBC-style padding oracle attacks.
3. **High Throughput:** Counter mode encryption and GHASH multiplication over $\text{GF}(2^{128})$ are parallelizable and hardware-accelerated via Intel AES-NI and ARM Cryptography Extensions.

### B. Why Shamir's Secret Sharing over $\text{GF}(2^8)$ (and Not Naive XOR Splitting)?
1. **Threshold Quorum ($k$-of-$n$):** Naive XOR splitting only supports $n$-of-$n$ schemes (requiring every single node). If even one node goes offline, data is lost permanently. Shamir's scheme enables fault-tolerant $(k, n)$ thresholding (any 3 of 5).
2. **Information-Theoretic Security:** In $\text{GF}(2^8)$, any $k-1$ shares provide **zero information** about the constant term $a_0$. For any hypothetical secret byte $S' \in \{0, \dots, 255\}$, there exists exactly one quadratic polynomial satisfying the $k-1$ known points. All 256 possible bytes remain equally likely, regardless of computational power.
3. **Zero Padding / Bit Expansion:** Operating byte-by-byte in $\text{GF}(2^8)$ means each share is **identically 32 bytes**, exactly matching the 256-bit AES key without BigInteger prime padding issues.

---

## 3. Mathematical Formulation

### 1. Polynomial Generation
For each byte $b \in \{0, \dots, 31\}$ of the AES-256 key $K$:
$$P_b(x) = K_b \oplus a_{1,b} x \oplus a_{2,b} x^2 \pmod{m(x)}$$
where:
- $m(x) = x^8 + x^4 + x^3 + x + 1$ (`0x11B`, Rijndael irreducible polynomial).
- $a_{1,b}, a_{2,b} \xleftarrow{\text{R}} \text{GF}(2^8)$ are generated via `SecureRandom`.

### 2. Share Generation
For nodes $i \in \{1, 2, 3, 4, 5\}$, share $i$ contains evaluated byte coordinates:
$$\text{Share}_i = (i, [P_0(i), P_1(i), \dots, P_{31}(i)])$$

### 3. Lagrange Interpolation at $x = 0$
Given any 3 distinct shares with indices $x_1, x_2, x_3$:
$$K_b = \bigoplus_{i=1}^3 \left( y_{i,b} \cdot \ell_i(0) \right)$$
where the Lagrange basis polynomials at $x = 0$ over $\text{GF}(2^8)$ are:
$$\ell_i(0) = \prod_{j \neq i} \frac{0 \oplus x_j}{x_i \oplus x_j} = \prod_{j \neq i} \frac{x_j}{x_i \oplus x_j}$$
*(In characteristic-2 fields, addition and subtraction are identical to bitwise XOR).*

---

## 4. Top 10 Viva & Interview Questions (With Model Answers)

### Q1: Why is the plaintext AES key never stored in the database?
**Answer:** "Storing the encryption key alongside the ciphertext violates the principle of zero-trust. In EchoVault, the plaintext AES key exists in volatile memory only during the split phase, after which it is immediately zeroized (`Arrays.fill(key, 0)`). Only the 5 Shamir shares are persisted across simulated storage nodes. An adversary breaching the database would need to compromise at least 3 distinct node repositories to reconstruct the key."

### Q2: What happens if an attacker steals 2 shares? Can they brute-force the remaining 1 share?
**Answer:** "No. Shamir's Secret Sharing over a finite field is **information-theoretically secure**. With only 2 points $(x_1, y_1)$ and $(x_2, y_2)$, there are 256 possible degree-2 polynomials passing through those 2 points, each intersecting $(0, S)$ for every possible byte value $S \in [0, 255]$. For a 32-byte key, there are $256^{32} = 2^{256}$ equally probable candidate keys. This leaves the attacker with exactly the same complexity as brute-forcing a raw 256-bit AES key from scratch."

### Q3: How does the system detect that a share has been tampered with?
**Answer:** "Shamir's scheme alone does not detect malicious shares, but EchoVault marries Shamir sharing with AES-GCM. If an attacker tampers with even a single bit of a share, polynomial interpolation reconstructs an incorrect AES key. When that key is used in AES-GCM decryption, the 128-bit GHASH authentication tag check fails, throwing `AEADBadTagException`. The system catches this, rejects the recovery, and never outputs corrupted plaintext."

### Q4: Why did you implement GF(2⁸) manually rather than using BigInteger with prime numbers?
**Answer:** "Prime-field Shamir schemes (e.g. $p > 2^{256}$) require 257-bit or 521-bit BigInteger arithmetic, which incurs memory overhead, requires byte padding, and introduces modular division complexity. In contrast, $\text{GF}(2^8)$ arithmetic operates byte-by-byte with constant-time lookup tables (Log/Exp tables using generator 3). Each share is exactly 32 bytes, matching the original key size with zero padding and deterministic performance."

### Q5: What is Shannon Entropy, and why does the dashboard display ~7.99 / 8.00 bits/byte?
**Answer:** "Shannon Entropy measures the average information density and unpredictability of data:
$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
For an 8-bit byte stream, the theoretical maximum entropy is $\log_2(256) = 8.00$ bits/byte. Plaintext files (PDFs, text) typically have entropy between 3.5 and 5.5 due to language redundancy. A properly encrypted AES-256-GCM ciphertext has uniformly distributed byte frequencies, yielding an entropy of ~7.99 / 8.00 bits/byte. This proves mathematically that the stored bytes leak zero recognizable pattern."

### Q6: How does the system prevent Path Traversal vulnerabilities during upload?
**Answer:** "User-supplied filenames are never used as physical disk paths. In `VaultStorageService`, the application extracts strictly the sanitized basename via `Path.of(name).getFileName().toString()`, while the physical file on disk is assigned a cryptographically generated UUID filename (`UUID.randomUUID().toString() + '.enc'`). The target path is normalized and validated using `targetPath.startsWith(baseStorageDir)` to ensure it never escapes the storage root."

### Q7: Can EchoVault handle large files (e.g. 100MB+ videos or ZIP files)?
**Answer:** "Yes. The backend configuration allows multipart uploads up to 250MB. Because AES-GCM is an authenticated counter-mode stream cipher (`NoPadding`), it encrypts arbitrary byte lengths with zero block-padding distortion. Decryption streams directly into the response with RFC 5987-compliant `ContentDisposition` headers."

### Q8: What database is used, and how difficult is it to migrate to MySQL?
**Answer:** "EchoVault defaults to an embedded, file-based H2 database (`./data/echovault.mv.db`) with `AUTO_SERVER=TRUE` for zero-configuration local execution. Because all models use standard Spring Data JPA and Hibernate annotations, migrating to MySQL requires only launching MySQL and running with `--spring.profiles.active=mysql`, using the pre-configured `application-mysql.yml`."

### Q9: How are automated tests isolated from the running server database?
**Answer:** "The test suite uses an isolated `src/test/resources/application.yml` pointing to an in-memory database (`jdbc:h2:mem:echovault_test`). This allows all 21 unit and integration tests to run concurrently without file-locking conflicts or interfering with live vault data."

### Q10: Is this storage genuinely distributed across distinct servers?
**Answer:** "In this MVP, the 5 storage nodes are simulated as distinct partitioned share entities within the cluster ledger. In a full production deployment, the node abstraction would map to remote microservice endpoints or cloud object stores (e.g., AWS S3, MinIO, or HashiCorp Vault instances) communicating over mTLS."

---

## 5. Live Demonstration Script for Evaluators

| Step | Action in UI | What to Say / Point Out |
|---|---|---|
| **1. Overview** | Show `http://localhost:5173` | *"Here is the EchoVault defense dashboard. Notice the live UTC clock, AES-256-GCM / Shamir 3-of-5 spec badges, and the interactive Orbital Topology Map."* |
| **2. Ingestion** | Drag-and-drop any file (PDF, PNG, etc.) | *"Watch the 4-phase pipeline: 256-bit AES key generation, AES-GCM encryption, Shamir polynomial split in $\text{GF}(2^8)$, and immediate zeroization of the key from RAM."* |
| **3. Entropy** | Click **"Hex"** on the file | *"Here is the raw ciphertext read directly from disk. Notice the Shannon entropy of ~7.99 / 8.00 bits/byte, proving it is indistinguishable from true random noise."* |
| **4. Scenario 1 (5 Nodes)** | Click **"Recovery Lab"** &rarr; *"All 5 Nodes Online"* &rarr; *"Decrypt & Inspect Payload"* | *"All 5 nodes are online. The Lagrange basis evaluates over $\text{GF}(2^8)$, the AES key is reconstructed, the 128-bit GHASH tag verifies, and the decrypted payload renders instantly in-browser."* |
| **5. Scenario 2 (Exact 3 Nodes)** | Click *"Exact Threshold (Nodes 1, 3, 5)"* &rarr; *"Download"* | *"Even with Nodes 2 and 4 offline (simulated node outage), threshold $k=3$ is satisfied. The exact original file is recovered and downloaded."* |
| **6. Scenario 3 (Under 2 Nodes)** | Click *"Fail: Only 2 Nodes (1, 2)"* &rarr; *"Simulate"* | *"When only 2 nodes are available, the system halts with a threshold deficiency error. Information-theoretic security guarantees that the key cannot be recovered."* |
| **7. Scenario 4 (Tampering)** | Select 3 nodes & select *"Corrupt Share #2 Payload"* &rarr; *"Simulate"* | *"Here an attacker attempts a bit-flip injection on Share #2. The reconstructed key is mathematically wrong, causing AES-GCM's 128-bit authentication tag check to fail instantly."* |
