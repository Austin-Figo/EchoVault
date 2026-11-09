# Security Notes

## Current security boundary
EchoVault is an academic proof of concept, not a production-ready distributed vault. The five named storage nodes are simulated records: encrypted file bytes are stored on the application filesystem and the Shamir shares are persisted by the same application database. This is not independent multi-node custody or fault-isolated storage.

## Important limitations before deployment
- The REST API currently has no authentication or authorization. Do not expose it to the public internet or store real personal or confidential files.
- Configure network access, TLS, authentication, authorization, rate limits, request-size limits, secure headers, and operational monitoring before any deployment beyond localhost.
- Keep database and storage backups protected. Deleting a database row or ciphertext file is not a guarantee of secure physical erasure from backups, SSDs, snapshots, or journaled filesystems.
- The H2 console is intended for local development only.
- AES-GCM requires a unique nonce per encryption under a given key. Preserve the nonce with the ciphertext and never reuse a key/nonce pair.
- Shamir shares stored together in one database do not provide independent compromise domains. A production design needs separately administered storage and access controls.

## Secrets
Supply MySQL credentials through environment variables. Do not commit populated `.env` files, passwords, API tokens, private keys, or production database dumps.
