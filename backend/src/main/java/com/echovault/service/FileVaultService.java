package com.echovault.service;

import com.echovault.crypto.AesGcmEncryptionService;
import com.echovault.crypto.SecretShare;
import com.echovault.crypto.ShamirSecretSharingService;
import com.echovault.dto.*;
import com.echovault.entity.KeyShare;
import com.echovault.entity.VaultFile;
import com.echovault.exception.DecryptionFailedException;
import com.echovault.exception.FileNotFoundException;
import com.echovault.exception.InsufficientSharesException;
import com.echovault.exception.InvalidFileException;
import com.echovault.repository.VaultFileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FileVaultService {

    private final VaultFileRepository fileRepository;
    private final VaultStorageService storageService;
    private final AesGcmEncryptionService aesService;
    private final ShamirSecretSharingService shamirService;

    private final int requiredThreshold;
    private final int totalShares;

    private static final String[] NODE_NAMES = {
            "Storage Node 1 (Alpha - Primary)",
            "Storage Node 2 (Beta - Secondary)",
            "Storage Node 3 (Gamma - Witness)",
            "Storage Node 4 (Delta - Replica A)",
            "Storage Node 5 (Epsilon - Replica B)"
    };

    public FileVaultService(
            VaultFileRepository fileRepository,
            VaultStorageService storageService,
            AesGcmEncryptionService aesService,
            ShamirSecretSharingService shamirService,
            @Value("${echovault.threshold.required-shares:3}") int requiredThreshold,
            @Value("${echovault.threshold.total-shares:5}") int totalShares
    ) {
        this.fileRepository = fileRepository;
        this.storageService = storageService;
        this.aesService = aesService;
        this.shamirService = shamirService;
        this.requiredThreshold = requiredThreshold;
        this.totalShares = totalShares;
    }

    public int getRequiredThreshold() {
        return requiredThreshold;
    }

    public int getTotalShares() {
        return totalShares;
    }

    /**
     * Ingests, encrypts with AES-256-GCM, splits the AES key using Shamir (3-of-5),
     * and stores encrypted bytes and key shares.
     */
    @Transactional
    public FileUploadResponse storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Cannot upload an empty file");
        }

        String rawName = file.getOriginalFilename();
        String safeOriginalName = (rawName != null && !rawName.isBlank())
                ? Path.of(rawName).getFileName().toString()
                : "file_" + System.currentTimeMillis();

        byte[] plainBytes;
        try {
            plainBytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidFileException("Failed to read uploaded file contents");
        }

        // 1. Generate unique 256-bit AES key and 96-bit GCM IV
        byte[] aesKey = aesService.generateAesKey();
        byte[] iv = aesService.generateIv();

        // 2. Encrypt plaintext with AES-256-GCM
        byte[] cipherText = aesService.encrypt(plainBytes, aesKey, iv);
        String checksum = aesService.computeSha256(plainBytes);

        // 3. Split the AES key into 5 shares with threshold 3 using Shamir Secret Sharing
        List<SecretShare> secretShares = shamirService.split(aesKey, requiredThreshold, totalShares);

        // Clear aesKey from memory as soon as shares are generated
        Arrays.fill(aesKey, (byte) 0);

        // 4. Store encrypted ciphertext to local storage
        String storageFileName = storageService.generateStorageFileName();
        Path savedPath = storageService.saveEncryptedBytes(storageFileName, cipherText);

        // 5. Create database record with metadata and key shares
        String fileId = UUID.randomUUID().toString();
        String ivBase64 = Base64.getEncoder().encodeToString(iv);

        VaultFile vaultFile = new VaultFile(
                fileId,
                safeOriginalName,
                storageFileName,
                file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                plainBytes.length,
                savedPath.toString(),
                ivBase64,
                checksum
        );

        for (int i = 0; i < secretShares.size(); i++) {
            SecretShare share = secretShares.get(i);
            String nodeName = (i < NODE_NAMES.length) ? NODE_NAMES[i] : "Storage Node " + share.index();
            KeyShare keyShare = new KeyShare(vaultFile, share.index(), nodeName, share.toBase64());
            vaultFile.addShare(keyShare);
        }

        fileRepository.save(vaultFile);

        List<ShareNodeDto> shareDtos = vaultFile.getShares().stream()
                .map(s -> new ShareNodeDto(s.getShareIndex(), s.getNodeName(), "HEALTHY", s.getCreatedAt()))
                .toList();

        return new FileUploadResponse(
                vaultFile.getId(),
                vaultFile.getOriginalFileName(),
                vaultFile.getFileSize(),
                "File successfully encrypted with AES-256-GCM and key distributed across 5 threshold nodes.",
                totalShares,
                requiredThreshold,
                shareDtos
        );
    }

    /**
     * Lists all vault files with metadata.
     */
    @Transactional(readOnly = true)
    public List<FileMetadataDto> listFiles() {
        return fileRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToMetadataDto)
                .toList();
    }

    /**
     * Retrieves file metadata by ID.
     */
    @Transactional(readOnly = true)
    public FileMetadataDto getFileMetadata(String fileId) {
        VaultFile vaultFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException(fileId));
        return mapToMetadataDto(vaultFile);
    }

    /**
     * Recovers and decrypts the file using selected available shares.
     */
    @Transactional(readOnly = true)
    public DecryptedFileResult recoverFile(String fileId, List<Integer> activeShareIndices, Integer tamperIndex) {
        VaultFile vaultFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException(fileId));

        byte[] plainBytes = performDecryption(vaultFile, activeShareIndices, tamperIndex);

        return new DecryptedFileResult(
                vaultFile.getOriginalFileName(),
                vaultFile.getContentType(),
                plainBytes
        );
    }

    /**
     * Simulates recovery for testing/demonstration without downloading the file.
     */
    @Transactional(readOnly = true)
    public FileRecoverySimulationResponse simulateRecovery(String fileId, List<Integer> activeShareIndices, Integer tamperIndex) {
        VaultFile vaultFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException(fileId));

        List<Integer> effectiveIndices = (activeShareIndices != null && !activeShareIndices.isEmpty())
                ? activeShareIndices.stream().distinct().sorted().toList()
                : vaultFile.getShares().stream().map(KeyShare::getShareIndex).sorted().toList();

        int activeCount = effectiveIndices.size();

        if (activeCount < requiredThreshold) {
            return new FileRecoverySimulationResponse(
                    false,
                    String.format("Recovery failed: Insufficient shares. Threshold requires at least %d shares, but only %d %s available (%s).",
                            requiredThreshold, activeCount, (activeCount == 1 ? "node was" : "nodes were"), effectiveIndices),
                    effectiveIndices,
                    requiredThreshold,
                    false,
                    false,
                    vaultFile.getFileSize(),
                    vaultFile.getOriginalFileName()
            );
        }

        try {
            byte[] decrypted = performDecryption(vaultFile, effectiveIndices, tamperIndex);
            return new FileRecoverySimulationResponse(
                    true,
                    String.format("Recovery successful: Reconstructed AES-256 key using %d active shares (%s). AES-GCM authentication tag verified.",
                            activeCount, effectiveIndices),
                    effectiveIndices,
                    requiredThreshold,
                    true,
                    true,
                    decrypted.length,
                    vaultFile.getOriginalFileName()
            );
        } catch (DecryptionFailedException e) {
            return new FileRecoverySimulationResponse(
                    false,
                    "Cryptographic verification rejected: " + e.getMessage(),
                    effectiveIndices,
                    requiredThreshold,
                    true,
                    false,
                    vaultFile.getFileSize(),
                    vaultFile.getOriginalFileName()
            );
        } catch (Exception e) {
            return new FileRecoverySimulationResponse(
                    false,
                    "Recovery error: " + e.getMessage(),
                    effectiveIndices,
                    requiredThreshold,
                    false,
                    false,
                    vaultFile.getFileSize(),
                    vaultFile.getOriginalFileName()
            );
        }
    }

    /**
     * Core decryption logic using threshold key reconstruction and AES-GCM verification.
     */
    private byte[] performDecryption(VaultFile vaultFile, List<Integer> activeShareIndices, Integer tamperIndex) {
        List<KeyShare> allShares = vaultFile.getShares();

        // Filter shares based on activeShareIndices
        List<KeyShare> filteredShares;
        if (activeShareIndices == null || activeShareIndices.isEmpty()) {
            filteredShares = new ArrayList<>(allShares);
        } else {
            Set<Integer> allowed = new HashSet<>(activeShareIndices);
            filteredShares = allShares.stream()
                    .filter(s -> allowed.contains(s.getShareIndex()))
                    .collect(Collectors.toList());
        }

        if (filteredShares.size() < requiredThreshold) {
            throw new InsufficientSharesException(filteredShares.size(), requiredThreshold);
        }

        // Convert entity shares to SecretShare models
        List<SecretShare> secretShares = new ArrayList<>();
        for (KeyShare ks : filteredShares) {
            byte[] shareBytes = Base64.getDecoder().decode(ks.getShareData());

            // If this share is selected for tamper simulation, corrupt its content
            if (tamperIndex != null && ks.getShareIndex() == tamperIndex) {
                byte[] corrupted = shareBytes.clone();
                corrupted[0] ^= (byte) 0xFF; // Invert first byte
                corrupted[1] ^= (byte) 0xAA;
                secretShares.add(new SecretShare(ks.getShareIndex(), corrupted));
            } else {
                secretShares.add(new SecretShare(ks.getShareIndex(), shareBytes));
            }
        }

        // Reconstruct AES-256 key via Shamir polynomial interpolation over GF(256)
        byte[] reconstructedKey = shamirService.reconstruct(secretShares, requiredThreshold);

        // Read encrypted bytes from filesystem
        byte[] cipherText = storageService.readEncryptedBytes(vaultFile.getStoragePath());
        byte[] iv = Base64.getDecoder().decode(vaultFile.getIvBase64());

        // Decrypt with AES-GCM and verify authentication tag
        byte[] plainBytes;
        try {
            plainBytes = aesService.decrypt(cipherText, reconstructedKey, iv);
        } finally {
            // Securely wipe reconstructed key
            Arrays.fill(reconstructedKey, (byte) 0);
        }

        return plainBytes;
    }

    /**
     * Deletes the file from both storage and database.
     */
    @Transactional
    public void deleteFile(String fileId) {
        VaultFile vaultFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException(fileId));

        // Delete from filesystem
        storageService.deleteEncryptedFile(vaultFile.getStoragePath());

        // Delete from database
        fileRepository.delete(vaultFile);
    }

    @Transactional(readOnly = true)
    public EncryptedSampleDto getEncryptedSample(String fileId) {
        VaultFile vaultFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException(fileId));

        byte[] cipherText = storageService.readEncryptedBytes(vaultFile.getStoragePath());
        int sampleLen = Math.min(cipherText.length, 256);
        byte[] sample = Arrays.copyOf(cipherText, sampleLen);
        String hex = HexFormat.of().formatHex(sample);

        int[] freq = new int[256];
        for (byte b : sample) {
            freq[b & 0xFF]++;
        }
        double entropy = 0.0;
        for (int count : freq) {
            if (count > 0) {
                double p = (double) count / sample.length;
                entropy -= p * (Math.log(p) / Math.log(2));
            }
        }

        return new EncryptedSampleDto(
                vaultFile.getId(),
                vaultFile.getOriginalFileName(),
                vaultFile.getFileSize(),
                cipherText.length,
                vaultFile.getIvBase64(),
                vaultFile.getChecksumSha256(),
                hex,
                Math.round(entropy * 100.0) / 100.0,
                vaultFile.getStoragePath()
        );
    }

    public long getFileCount() {
        return fileRepository.count();
    }

    private FileMetadataDto mapToMetadataDto(VaultFile file) {
        List<ShareNodeDto> shareDtos = file.getShares().stream()
                .map(s -> new ShareNodeDto(s.getShareIndex(), s.getNodeName(), "HEALTHY", s.getCreatedAt()))
                .toList();

        return new FileMetadataDto(
                file.getId(),
                file.getOriginalFileName(),
                file.getContentType(),
                file.getFileSize(),
                file.getChecksumSha256(),
                file.getCreatedAt(),
                file.getShares().size(),
                requiredThreshold,
                file.getShares().size() >= requiredThreshold,
                shareDtos
        );
    }

    public record DecryptedFileResult(String fileName, String contentType, byte[] data) {}
}
