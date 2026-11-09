# EchoVault — Encrypted File Vault with Threshold Key Recovery

EchoVault is an academic proof of concept for encrypted file storage and threshold-based key recovery. It combines AES-256-GCM authenticated encryption with a 3-of-5 Shamir Secret Sharing demonstration.

> **Status:** Partially implemented academic prototype. Storage nodes are simulated locally and the REST API currently has no authentication or authorization. Do not expose this application to the public internet or use it for real confidential data.

## What it demonstrates

- **File encryption:** AES-256-GCM authenticated encryption using a per-file key and nonce.
- **Threshold key splitting:** Shamir Secret Sharing with a 3-of-5 recovery threshold over GF(2^8).
- **Recovery workflow:** Reconstruct a key when at least three shares are available.
- **Tamper detection:** AES-GCM authentication rejects ciphertext or key material that does not validate.
- **Recovery simulation:** Demonstrate threshold success, threshold failure, and corrupted-share scenarios through the dashboard.
- **Web application:** Spring Boot REST backend with a React/Vite frontend.

## Architecture and technology

| Layer | Implementation |
|---|---|
| Frontend | React 18, Vite, JavaScript |
| Backend | Java 21, Spring Boot 3.3.x |
| Persistence | Spring Data JPA with file-based H2 by default |
| Cryptography | Java Cryptography Architecture, AES/GCM, Shamir Secret Sharing |
| Optional database | MySQL profile |
| Tests | JUnit 5 and Spring Boot Test sources |

## Security model and important boundary

The five node labels are **simulated**, not five independent machines or cloud services. Ciphertext is stored on the application filesystem and shares are persisted by the same application database. This prototype therefore does not provide independent compromise domains, distributed availability, or zero-knowledge custody.

The REST API currently has **no authentication or authorization**. Run it locally only. The H2 console is for local development. Read [SECURITY.md](SECURITY.md) before running the application.

## Repository layout

```text
EchoVault/
├── backend/
│   ├── src/main/java/com/echovault/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── crypto/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   └── service/
│   ├── src/main/resources/
│   ├── src/test/
│   ├── mvnw.cmd
│   └── pom.xml
├── frontend/
│   ├── src/
│   └── package.json
├── storage/
└── docs/
    ├── ARCHITECTURE.md
    └── API.md
```

## Prerequisites

- Java 21 JDK
- Node.js 18 or later and npm
- Maven 3.9+ or the included Maven wrapper

## Run locally

### 1. Start the backend

From the backend directory:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend listens on http://localhost:8080 by default.

### 2. Start the frontend

Open a second terminal in the frontend directory:

```powershell
npm install
npm run dev
```

Open the local Vite URL printed by the development server (normally http://localhost:5173).

### 3. Run backend tests

From the backend directory:

```powershell
.\mvnw.cmd test
```

Test source files are included. Test execution and results must be verified against the exact checkout before reporting pass counts or coverage.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Application health information |
| POST | /api/files | Upload and encrypt a file |
| GET | /api/files | List stored file records |
| GET | /api/files/{id}/status | Inspect file and share status |
| POST | /api/files/{id}/recover | Attempt threshold recovery |
| POST | /api/files/{id}/simulate | Run a recovery simulation |
| DELETE | /api/files/{id} | Delete application-level file records and stored ciphertext |

See [docs/API.md](docs/API.md) for request and response details. Application-level deletion is not a guarantee of secure physical erasure from backups, snapshots, or storage media.

## Cryptographic workflow

1. Generate a random 256-bit file-encryption key.
2. Encrypt the file using AES-256-GCM and retain the nonce with the ciphertext metadata.
3. Split the key into five Shamir shares with a threshold of three.
4. Persist ciphertext and shares within the current single-application storage boundary.
5. Reconstruct the key from any three valid shares and authenticate/decrypt the ciphertext.

AES-GCM requires nonce uniqueness for each encryption under a given key. The implementation and deployment should be reviewed before production use.

## Scope and future work

This repository demonstrates cryptographic building blocks and a recovery workflow. Production readiness would require authenticated and authorized APIs, independent share custody, hardened key lifecycle management, TLS, rate limiting, operational monitoring, backup controls, and deployment security review.
