package com.echovault.service;

import com.echovault.crypto.AesGcmEncryptionService;
import com.echovault.crypto.ShamirSecretSharingService;
import com.echovault.dto.FileMetadataDto;
import com.echovault.dto.FileRecoverySimulationResponse;
import com.echovault.dto.FileUploadResponse;
import com.echovault.entity.VaultFile;
import com.echovault.exception.DecryptionFailedException;
import com.echovault.exception.InsufficientSharesException;
import com.echovault.repository.VaultFileRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class FileVaultServiceTest {

    @Autowired
    private FileVaultService fileVaultService;

    @Autowired
    private VaultFileRepository fileRepository;

    @Autowired
    private VaultStorageService storageService;

    private String uploadedFileId;

    @AfterEach
    void cleanup() {
        if (uploadedFileId != null) {
            try {
                fileVaultService.deleteFile(uploadedFileId);
            } catch (Exception ignored) {
            }
        }
    }

    @Test
    @DisplayName("Uploads file, splits AES key into 5 shares, and stores encrypted payload on disk")
    void testUploadFile() {
        byte[] content = "Important classified dossier for EchoVault verification.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "dossier.txt", "text/plain", content);

        FileUploadResponse response = fileVaultService.storeFile(file);
        uploadedFileId = response.id();

        assertNotNull(uploadedFileId);
        assertEquals("dossier.txt", response.fileName());
        assertEquals(content.length, response.fileSize());
        assertEquals(5, response.totalSharesGenerated());
        assertEquals(3, response.recoveryThreshold());
        assertEquals(5, response.shares().size());

        // Verify entity persisted in DB
        VaultFile entity = fileRepository.findById(uploadedFileId).orElse(null);
        assertNotNull(entity);
        assertEquals(5, entity.getShares().size());
        assertTrue(Files.exists(Path.of(entity.getStoragePath())));
    }

    @Test
    @DisplayName("Successfully recovers file using any 3 valid shares")
    void testRecoveryWithThreeShares() {
        byte[] content = "Payload to recover with shares 1, 3, and 5.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "recovery_test.txt", "text/plain", content);

        FileUploadResponse response = fileVaultService.storeFile(file);
        uploadedFileId = response.id();

        // Recover using shares 1, 3, 5
        FileVaultService.DecryptedFileResult result = fileVaultService.recoverFile(
                uploadedFileId, List.of(1, 3, 5), null
        );

        assertNotNull(result);
        assertEquals("recovery_test.txt", result.fileName());
        assertArrayEquals(content, result.data());
    }

    @Test
    @DisplayName("Successfully recovers file using all 5 shares")
    void testRecoveryWithAllFiveShares() {
        byte[] content = "Payload to recover with all 5 shares.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "all_five.txt", "text/plain", content);

        FileUploadResponse response = fileVaultService.storeFile(file);
        uploadedFileId = response.id();

        FileVaultService.DecryptedFileResult result = fileVaultService.recoverFile(
                uploadedFileId, List.of(1, 2, 3, 4, 5), null
        );

        assertArrayEquals(content, result.data());
    }

    @Test
    @DisplayName("Fails to recover file when only 2 shares are provided (threshold not met)")
    void testRecoveryFailsWithTwoShares() {
        byte[] content = "Will fail with only 2 shares.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "fail_two.txt", "text/plain", content);

        FileUploadResponse response = fileVaultService.storeFile(file);
        uploadedFileId = response.id();

        assertThrows(InsufficientSharesException.class, () ->
                fileVaultService.recoverFile(uploadedFileId, List.of(1, 2), null)
        );
    }

    @Test
    @DisplayName("Fails with DecryptionFailedException when a share has been tampered with")
    void testRecoveryFailsWhenShareTampered() {
        byte[] content = "Tampered share detection.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "tamper.txt", "text/plain", content);

        FileUploadResponse response = fileVaultService.storeFile(file);
        uploadedFileId = response.id();

        // Tamper with share 2
        assertThrows(DecryptionFailedException.class, () ->
                fileVaultService.recoverFile(uploadedFileId, List.of(1, 2, 3), 2)
        );
    }

    @Test
    @DisplayName("Simulate recovery accurately reflects threshold requirements and success/failure")
    void testSimulateRecovery() {
        byte[] content = "Simulation test content.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "sim.txt", "text/plain", content);

        FileUploadResponse response = fileVaultService.storeFile(file);
        uploadedFileId = response.id();

        // 3 shares -> success
        FileRecoverySimulationResponse simSuccess = fileVaultService.simulateRecovery(uploadedFileId, List.of(2, 4, 5), null);
        assertTrue(simSuccess.success());
        assertTrue(simSuccess.thresholdMet());
        assertTrue(simSuccess.authenticationVerified());

        // 2 shares -> failure
        FileRecoverySimulationResponse simFail = fileVaultService.simulateRecovery(uploadedFileId, List.of(1, 4), null);
        assertFalse(simFail.success());
        assertFalse(simFail.thresholdMet());
        assertFalse(simFail.authenticationVerified());
        assertTrue(simFail.message().contains("Insufficient shares"));

        // 3 shares with tampering -> failure
        FileRecoverySimulationResponse simTamper = fileVaultService.simulateRecovery(uploadedFileId, List.of(1, 2, 3), 1);
        assertFalse(simTamper.success());
        assertTrue(simTamper.thresholdMet());
        assertFalse(simTamper.authenticationVerified());
        assertTrue(simTamper.message().contains("Cryptographic verification rejected"));
    }

    @Test
    @DisplayName("Deletes file and cleans up both storage and database records")
    void testDeleteFile() {
        byte[] content = "To be deleted.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "delete_me.txt", "text/plain", content);

        FileUploadResponse response = fileVaultService.storeFile(file);
        String id = response.id();

        VaultFile entity = fileRepository.findById(id).orElseThrow();
        String storagePath = entity.getStoragePath();
        assertTrue(Files.exists(Path.of(storagePath)));

        fileVaultService.deleteFile(id);

        assertFalse(fileRepository.existsById(id));
        assertFalse(Files.exists(Path.of(storagePath)));
    }
}
