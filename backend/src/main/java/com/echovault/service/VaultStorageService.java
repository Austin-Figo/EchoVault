package com.echovault.service;

import com.echovault.exception.VaultException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Handles physical local filesystem operations for encrypted vault storage.
 *
 * Guarantees:
 * - Generates secure random filenames rather than trusting client-supplied paths.
 * - Prevents path traversal vulnerabilities.
 * - Stores encrypted bytes only.
 */
@Service
public class VaultStorageService {

    private final Path storageDirectory;

    public VaultStorageService(@Value("${echovault.storage.base-path:../storage}") String basePath) {
        this.storageDirectory = Paths.get(basePath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            if (!Files.exists(storageDirectory)) {
                Files.createDirectories(storageDirectory);
            }
        } catch (IOException e) {
            throw new VaultException("Failed to initialize encrypted vault storage directory: " + storageDirectory, e);
        }
    }

    /**
     * Generates a safe storage filename for the encrypted file.
     */
    public String generateStorageFileName() {
        return UUID.randomUUID() + ".enc";
    }

    /**
     * Stores encrypted bytes to disk under the generated safe name.
     */
    public Path saveEncryptedBytes(String storageFileName, byte[] encryptedBytes) {
        validateStorageFileName(storageFileName);
        Path targetPath = storageDirectory.resolve(storageFileName).normalize();
        validatePathSafety(targetPath);

        try {
            return Files.write(targetPath, encryptedBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            throw new VaultException("Failed to save encrypted bytes to disk: " + storageFileName, e);
        }
    }

    /**
     * Reads encrypted bytes from disk.
     */
    public byte[] readEncryptedBytes(String storagePath) {
        Path path = Paths.get(storagePath).toAbsolutePath().normalize();
        validatePathSafety(path);

        if (!Files.exists(path) || !Files.isRegularFile(path)) {
            throw new VaultException("Encrypted storage file does not exist on disk: " + path);
        }

        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new VaultException("Failed to read encrypted file from disk: " + path, e);
        }
    }

    /**
     * Deletes an encrypted file from disk.
     */
    public boolean deleteEncryptedFile(String storagePath) {
        try {
            Path path = Paths.get(storagePath).toAbsolutePath().normalize();
            validatePathSafety(path);
            return Files.deleteIfExists(path);
        } catch (Exception e) {
            // Log without failing deletion completely
            return false;
        }
    }

    /**
     * Calculates total storage size used by files in the storage directory.
     */
    public long getTotalStorageUsedBytes() {
        if (!Files.exists(storageDirectory)) {
            return 0L;
        }
        try (Stream<Path> stream = Files.walk(storageDirectory)) {
            return stream
                    .filter(Files::isRegularFile)
                    .mapToLong(p -> {
                        try {
                            return Files.size(p);
                        } catch (IOException e) {
                            return 0L;
                        }
                    })
                    .sum();
        } catch (IOException e) {
            return 0L;
        }
    }

    public Path getStorageDirectory() {
        return storageDirectory;
    }

    private void validateStorageFileName(String fileName) {
        if (fileName == null || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new IllegalArgumentException("Invalid storage filename: " + fileName);
        }
    }

    private void validatePathSafety(Path targetPath) {
        if (!targetPath.startsWith(storageDirectory)) {
            throw new SecurityException("Potential path traversal attempt detected outside storage boundary: " + targetPath);
        }
    }
}
