package com.echovault.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vault_files")
public class VaultFile {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, length = 255)
    private String originalFileName;

    @Column(nullable = false, length = 255)
    private String sanitizedStorageName;

    @Column(length = 128)
    private String contentType;

    @Column(nullable = false)
    private long fileSize;

    @Column(nullable = false, length = 512)
    private String storagePath;

    @Column(nullable = false, length = 64)
    private String ivBase64;

    @Column(nullable = false, length = 64)
    private String checksumSha256;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "vaultFile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("shareIndex ASC")
    private List<KeyShare> shares = new ArrayList<>();

    public VaultFile() {
    }

    public VaultFile(String id, String originalFileName, String sanitizedStorageName,
                     String contentType, long fileSize, String storagePath,
                     String ivBase64, String checksumSha256) {
        this.id = id;
        this.originalFileName = originalFileName;
        this.sanitizedStorageName = sanitizedStorageName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.storagePath = storagePath;
        this.ivBase64 = ivBase64;
        this.checksumSha256 = checksumSha256;
        this.createdAt = LocalDateTime.now();
    }

    public void addShare(KeyShare share) {
        shares.add(share);
        share.setVaultFile(this);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getSanitizedStorageName() {
        return sanitizedStorageName;
    }

    public void setSanitizedStorageName(String sanitizedStorageName) {
        this.sanitizedStorageName = sanitizedStorageName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getIvBase64() {
        return ivBase64;
    }

    public void setIvBase64(String ivBase64) {
        this.ivBase64 = ivBase64;
    }

    public String getChecksumSha256() {
        return checksumSha256;
    }

    public void setChecksumSha256(String checksumSha256) {
        this.checksumSha256 = checksumSha256;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<KeyShare> getShares() {
        return shares;
    }

    public void setShares(List<KeyShare> shares) {
        this.shares = shares;
    }
}
