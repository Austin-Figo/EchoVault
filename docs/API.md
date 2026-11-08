# EchoVault REST API Reference

Base URL: `http://localhost:8080`

All endpoints are CORS-enabled for local development origins (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`).

---

### 1. Health & Cluster Status
`GET /api/health`

**Response `200 OK`**:
```json
{
  "status": "UP",
  "activeDatabase": "H2 (File-based local persistent)",
  "storagePath": "E:\\EchoVault\\storage",
  "storageUsedBytes": 1048576,
  "fileCount": 3,
  "thresholdRequired": 3,
  "totalShares": 5,
  "timestamp": "2026-10-12T14:00:00"
}
```

---

### 2. Ingest and Encrypt File
`POST /api/files`

**Content-Type:** `multipart/form-data`
**Parameters:**
- `file`: Binary file upload (max 50MB)

**Response `200 OK`**:
```json
{
  "id": "e4b6c310-410a-4a69-8e8e-67e42d763ff4",
  "fileName": "classified_document.pdf",
  "fileSize": 1048576,
  "message": "File successfully encrypted with AES-256-GCM and key distributed across 5 threshold nodes.",
  "totalSharesGenerated": 5,
  "recoveryThreshold": 3,
  "shares": [
    { "shareIndex": 1, "nodeName": "Storage Node 1 (Alpha - Primary)", "status": "HEALTHY", "storedAt": "2026-10-12T14:00:00" },
    { "shareIndex": 2, "nodeName": "Storage Node 2 (Beta - Secondary)", "status": "HEALTHY", "storedAt": "2026-10-12T14:00:00" },
    { "shareIndex": 3, "nodeName": "Storage Node 3 (Gamma - Witness)", "status": "HEALTHY", "storedAt": "2026-10-12T14:00:00" },
    { "shareIndex": 4, "nodeName": "Storage Node 4 (Delta - Replica A)", "status": "HEALTHY", "storedAt": "2026-10-12T14:00:00" },
    { "shareIndex": 5, "nodeName": "Storage Node 5 (Epsilon - Replica B)", "status": "HEALTHY", "storedAt": "2026-10-12T14:00:00" }
  ]
}
```

---

### 3. List Stored Files
`GET /api/files`

**Response `200 OK`**:
```json
[
  {
    "id": "e4b6c310-410a-4a69-8e8e-67e42d763ff4",
    "originalFileName": "classified_document.pdf",
    "contentType": "application/pdf",
    "fileSize": 1048576,
    "checksumSha256": "4a5b6c...",
    "createdAt": "2026-10-12T14:00:00",
    "totalShares": 5,
    "thresholdRequired": 3,
    "isRecoverable": true,
    "shares": [...]
  }
]
```

---

### 4. Get File Status
`GET /api/files/{id}/status`

**Response `200 OK`**:
Returns the file's metadata and array of 5 stored key shares.

---

### 5. Recover or Simulate Recovery
`POST /api/files/{id}/recover`

**Headers:** `Content-Type: application/json`

**Request Body (optional):**
```json
{
  "activeShareIndices": [1, 2, 4],
  "simulateOnly": false,
  "tamperShareIndex": null
}
```

- When `simulateOnly: true`:
  Returns JSON simulation report:
  ```json
  {
    "success": true,
    "message": "Recovery successful: Reconstructed AES-256 key using 3 active shares ([1, 2, 4]). AES-GCM authentication tag verified.",
    "sharesUsed": [1, 2, 4],
    "thresholdRequired": 3,
    "thresholdMet": true,
    "authenticationVerified": true,
    "fileSize": 1048576,
    "fileName": "classified_document.pdf"
  }
  ```
- When `simulateOnly: false`:
  Returns raw binary decrypted payload with download headers:
  - `Content-Disposition: attachment; filename="classified_document.pdf"`
  - `Content-Type: application/pdf`

**Error Cases:**
- Fewer than 3 shares: `400 Bad Request`
- Tampered share or corrupted ciphertext: `422 Unprocessable Entity`

---

### 6. Delete File
`DELETE /api/files/{id}`

Permanently removes the encrypted ciphertext from disk and deletes the database record and key shares.

**Response `200 OK`**:
```json
{
  "success": true,
  "message": "File and associated threshold key shares deleted successfully.",
  "id": "e4b6c310-410a-4a69-8e8e-67e42d763ff4"
}
```
