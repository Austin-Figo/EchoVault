package com.echovault.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "key_shares", indexes = {
        @Index(name = "idx_share_file_id", columnList = "vault_file_id")
})
public class KeyShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vault_file_id", nullable = false)
    private VaultFile vaultFile;

    @Column(nullable = false)
    private int shareIndex;

    @Column(nullable = false, length = 64)
    private String nodeName;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String shareData; // Base64 encoded share bytes

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public KeyShare() {
    }

    public KeyShare(VaultFile vaultFile, int shareIndex, String nodeName, String shareData) {
        this.vaultFile = vaultFile;
        this.shareIndex = shareIndex;
        this.nodeName = nodeName;
        this.shareData = shareData;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public VaultFile getVaultFile() {
        return vaultFile;
    }

    public void setVaultFile(VaultFile vaultFile) {
        this.vaultFile = vaultFile;
    }

    public int getShareIndex() {
        return shareIndex;
    }

    public void setShareIndex(int shareIndex) {
        this.shareIndex = shareIndex;
    }

    public String getNodeName() {
        return nodeName;
    }

    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }

    public String getShareData() {
        return shareData;
    }

    public void setShareData(String shareData) {
        this.shareData = shareData;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
