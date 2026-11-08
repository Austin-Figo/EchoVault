package com.echovault.controller;

import com.echovault.dto.*;
import com.echovault.service.FileVaultService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileVaultController {

    private final FileVaultService fileVaultService;

    public FileVaultController(FileVaultService fileVaultService) {
        this.fileVaultService = fileVaultService;
    }

    /**
     * Upload and encrypt a file with AES-256-GCM and Shamir (3-of-5) key splitting.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        FileUploadResponse response = fileVaultService.storeFile(file);
        return ResponseEntity.ok(response);
    }

    /**
     * List all vault files with metadata and share status.
     */
    @GetMapping
    public ResponseEntity<List<FileMetadataDto>> listFiles() {
        List<FileMetadataDto> files = fileVaultService.listFiles();
        return ResponseEntity.ok(files);
    }

    /**
     * Retrieve status and share details for a specific file.
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<FileMetadataDto> getFileStatus(@PathVariable("id") String id) {
        FileMetadataDto file = fileVaultService.getFileMetadata(id);
        return ResponseEntity.ok(file);
    }

    /**
     * Retrieve metadata for a specific file.
     */
    @GetMapping("/{id}")
    public ResponseEntity<FileMetadataDto> getFileById(@PathVariable("id") String id) {
        FileMetadataDto file = fileVaultService.getFileMetadata(id);
        return ResponseEntity.ok(file);
    }

    /**
     * Retrieve a raw ciphertext hex sample and Shannon entropy metrics for the file.
     */
    @GetMapping("/{id}/encrypted-sample")
    public ResponseEntity<EncryptedSampleDto> getEncryptedSample(@PathVariable("id") String id) {
        EncryptedSampleDto sample = fileVaultService.getEncryptedSample(id);
        return ResponseEntity.ok(sample);
    }

    /**
     * Recover file using available shares.
     * If request body has simulateOnly = true or query param simulate = true, returns JSON simulation report.
     * Otherwise streams the decrypted file bytes for download or in-browser preview.
     */
    @PostMapping("/{id}/recover")
    public ResponseEntity<?> recoverFile(
            @PathVariable("id") String id,
            @RequestBody(required = false) FileRecoveryRequest request,
            @RequestParam(name = "simulate", defaultValue = "false") boolean simulateQuery,
            @RequestParam(name = "inline", defaultValue = "false") boolean inlineQuery
    ) {
        boolean isSimulate = simulateQuery || (request != null && request.simulateOnly());
        List<Integer> activeShares = (request != null) ? request.activeShareIndices() : null;
        Integer tamperIndex = (request != null) ? request.tamperShareIndex() : null;

        if (isSimulate) {
            FileRecoverySimulationResponse sim = fileVaultService.simulateRecovery(id, activeShares, tamperIndex);
            return ResponseEntity.ok(sim);
        }

        FileVaultService.DecryptedFileResult result = fileVaultService.recoverFile(id, activeShares, tamperIndex);

        ContentDisposition disposition = (inlineQuery ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(result.fileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CONTENT_TYPE, result.contentType() != null ? result.contentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(result.data().length))
                .body(result.data());
    }

    /**
     * Dedicated endpoint for explicit recovery simulation.
     */
    @PostMapping("/{id}/simulate")
    public ResponseEntity<FileRecoverySimulationResponse> simulateRecovery(
            @PathVariable("id") String id,
            @RequestBody(required = false) FileRecoveryRequest request
    ) {
        List<Integer> activeShares = (request != null) ? request.activeShareIndices() : null;
        Integer tamperIndex = (request != null) ? request.tamperShareIndex() : null;
        FileRecoverySimulationResponse sim = fileVaultService.simulateRecovery(id, activeShares, tamperIndex);
        return ResponseEntity.ok(sim);
    }

    /**
     * Permanently delete a file from encrypted storage and database.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable("id") String id) {
        fileVaultService.deleteFile(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "File and associated threshold key shares deleted successfully.",
                "id", id
        ));
    }
}
