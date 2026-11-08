# EchoVault — Secure Distributed Data Storage Using Encryption and Threshold-Based Recovery

EchoVault is a secure distributed storage proof-of-concept application built with **Java 21**, **Spring Boot 3.x**, and **React + Vite**. It encrypts files using **AES-256-GCM** authenticated encryption and distributes the encryption key across five simulated storage nodes using **Shamir's Secret Sharing Scheme (3-of-5 threshold)** over the finite field $\text{GF}(2^8)$.

---

## Key Highlights

- **Authenticated Encryption:** Every file is encrypted with a distinct, randomly generated 256-bit AES key and a 96-bit GCM nonce. The 128-bit authentication tag guarantees confidentiality and tamper-evidence.
- **True Shamir's Secret Sharing:** Implemented strictly over the Galois Field $\text{GF}(2^8)$ using the irreducible AES polynomial $x^8 + x^4 + x^3 + x + 1$ (`0x11B`) and `SecureRandom`. Never uses XOR splits or duplicate keys.
- **Zero-Knowledge Key Storage:** The original AES-256 key is **never saved on disk or in the database**. It is wiped from memory immediately after generating the five shares.
- **Threshold Recovery:** Any **3 of 5** shares can reconstruct the AES key via Lagrange interpolation. Any 2 or fewer shares convey **zero information** about the key.
- **Tamper Detection:** AES-GCM verification (`AEADBadTagException`) detects and rejects corrupted ciphertexts or invalid key shares, ensuring corrupted plaintext is never returned.
- **Interactive Recovery Lab:** A built-in security dashboard allows real-time simulation of node outages (e.g. 5, 3, or 2 nodes available) and share byte corruption attacks.
- **Zero-Config Database:** Uses an embedded, file-based H2 database for instant local execution.

---

## Technology Stack

- **Backend:** Java 21, Spring Boot 3.3.4, Spring Data JPA, Spring Web, Hibernate, H2 Database (file-based)
- **Cryptography:** Java Cryptography Architecture (`Cipher`, `AES/GCM/NoPadding`, `SecureRandom`, `MessageDigest`), custom $\text{GF}(2^8)$ Shamir Secret Sharing engine
- **Frontend:** React 18, Vite 5, JavaScript, Custom Responsive Dark Theme CSS
- **Testing:** JUnit 5, Spring Boot Test, MockMvc (21 passing automated tests)

---

## Project Structure

```
EchoVault/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/echovault/
│   │   │   │   ├── config/             # CORS and storage configuration
│   │   │   │   ├── controller/         # REST Controllers (Files, Health)
│   │   │   │   ├── crypto/             # GF256, ShamirSecretSharing, AesGcm
│   │   │   │   ├── dto/                # Request & response data transfer objects
│   │   │   │   ├── entity/             # JPA Entities (VaultFile, KeyShare)
│   │   │   │   ├── exception/          # Custom exceptions & GlobalExceptionHandler
│   │   │   │   ├── repository/         # Spring Data JPA repositories
│   │   │   │   └── service/            # Business & storage orchestration
│   │   │   └── resources/
│   │   │       └── application.yml     # Database, storage, and CORS config
│   │   └── test/                       # 21 JUnit 5 unit & integration tests
│   ├── mvnw.cmd                        # Convenient Maven runner script
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/                 # Navbar, Stats, NodeRack, Upload, FileTable, RecoveryLab
│   │   ├── App.jsx                     # Core state & dashboard
│   │   ├── App.css                     # Dark cybersecurity UI theme
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── storage/                            # Encrypted ciphertext storage directory (.enc)
├── docs/
│   ├── ARCHITECTURE.md                 # Detailed cryptographic & mathematical design
│   └── API.md                          # REST API specification
└── README.md
```

---

## Prerequisites

1. **Java 21 JDK** (e.g., Eclipse Adoptium Temurin 21 or Oracle JDK 21)
2. **Maven 3.9+** (Installed or referenced via full path / `mvnw.cmd`)
3. **Node.js v18+ and npm** (Node v24 and npm 11 verified)

---

## Quick Start & Launch Commands

### 1. Launch the Backend (Terminal 1)

Navigate to the `backend/` directory and run:

```powershell
cd E:\EchoVault\backend

# Option A: If Maven is on PATH:
mvn spring-boot:run

# Option B: Using the configured Maven installation directly:
& "C:\Program Files\Apache\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run

# Option C: Using the included wrapper script:
.\mvnw.cmd spring-boot:run
```

The Spring Boot backend will start on **`http://localhost:8080`**.
H2 Web Console is accessible at **`http://localhost:8080/h2-console`** (`JDBC URL: jdbc:h2:file:./data/echovault`, user: `sa`, password empty).

### 2. Launch the Frontend (Terminal 2)

In a separate terminal, navigate to the `frontend/` directory and run:

```powershell
cd E:\EchoVault\frontend

# Install dependencies (already executed during setup):
npm install

# Start the Vite development server:
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## Running the Automated Test Suite

To run all 21 unit and integration tests (AES-GCM round-trip, tamper detection, Shamir 3-of-5 combinations, and REST controller flows):

```powershell
cd E:\EchoVault\backend
& "C:\Program Files\Apache\apache-maven-3.9.16\bin\mvn.cmd" test
```

### Test Coverage Highlights:
- **`AesGcmEncryptionServiceTest`**: Verifies authenticated round-trip, tag rejection on flipped ciphertext bits, wrong key rejection, and nonce uniqueness.
- **`ShamirSecretSharingServiceTest`**: Proves all 10 combinations of 3 shares ($\binom{5}{3} = 10$) recover the exact 256-bit key, confirms 4 and 5 shares recover, and proves any 2 shares are rejected due to threshold failure.
- **`FileVaultServiceTest`**: Integration tests for upload, threshold recovery, tampered share detection, file deletion, and storage cleanup.
- **`FileVaultControllerTest`**: End-to-end MockMvc tests validating REST contracts, headers, and error responses.

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System status, database info, storage usage, and threshold configuration |
| `POST` | `/api/files` | Multipart file upload; encrypts and distributes 5 shares |
| `GET` | `/api/files` | Lists all stored vault files and share health |
| `GET` | `/api/files/{id}/status` | Detailed metadata and 5 node shares for a file |
| `POST` | `/api/files/{id}/recover` | Recovers and downloads file; supports simulation mode |
| `POST` | `/api/files/{id}/simulate`| Dedicated simulation endpoint for threshold validation |
| `DELETE` | `/api/files/{id}` | Permanently removes ciphertext from disk and database records |

See [`docs/API.md`](docs/API.md) for full request/response schemas.

---

## How to Test the 3-of-5 Recovery Demonstration

1. Open the UI at **`http://localhost:5173`**.
2. **Upload a file** by dragging it into the ingestion area.
   - The UI will display the generated shares distributed across **Nodes 1 through 5**.
3. In the ledger table, click **"Recovery Lab"** on the uploaded file.
4. **Test Scenario A — Full Cluster (5 of 5):**
   - Click "All 5 Nodes Online" &rarr; click "Simulate Recovery".
   - Result: Key reconstructed successfully, AES-GCM tag verified.
5. **Test Scenario B — Threshold Recovery (3 of 5):**
   - Click "Exactly 3 Nodes (1, 3, 5)" &rarr; click "Simulate Recovery" or "Recover & Download".
   - Result: Key reconstructed with mathematical precision; file downloads intact.
6. **Test Scenario C — Threshold Failure (2 of 5):**
   - Click "Fail: Only 2 Nodes (1, 2)" &rarr; click "Simulate Recovery".
   - Result: Rejection message: *"Threshold not met: at least 3 shares are required, but only 2 were provided"*.
7. **Test Scenario D — Attack / Tamper Simulation:**
   - Select 3 shares, then select "Corrupt Share #2 Bytes" from the dropdown.
   - Click "Simulate Recovery".
   - Result: Decryption fails with `AEADBadTagException` (AES-GCM authentication verification rejected).

---

## Database Migration Path (H2 to MySQL)

EchoVault uses standard Spring Data JPA entities. To migrate from H2 to MySQL when ready:
1. Update `backend/pom.xml` to include `com.mysql:mysql-connector-j`.
2. In `backend/src/main/resources/application.yml`, replace the datasource block:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/echovault?useSSL=false&serverTimezone=UTC
       username: <your_mysql_user>
       password: <your_mysql_password>
     jpa:
       hibernate:
         ddl-auto: update
   ```

---

## Disclaimers & Limitations

- **Simulated Node Distribution:** In this MVP, storage nodes and share repositories are simulated locally on a single machine rather than physically separated across distributed network hosts.
- **Proof-of-Concept Status:** EchoVault is built as an educational demonstration of threshold cryptography and authenticated encryption. It is **not claimed to be production-ready**.
