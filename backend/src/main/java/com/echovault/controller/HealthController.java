package com.echovault.controller;

import com.echovault.dto.HealthResponse;
import com.echovault.service.FileVaultService;
import com.echovault.service.VaultStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final FileVaultService fileVaultService;
    private final VaultStorageService storageService;

    public HealthController(FileVaultService fileVaultService, VaultStorageService storageService) {
        this.fileVaultService = fileVaultService;
        this.storageService = storageService;
    }

    @GetMapping
    public ResponseEntity<HealthResponse> getHealth() {
        HealthResponse response = new HealthResponse(
                "UP",
                "H2 (File-based local persistent)",
                storageService.getStorageDirectory().toString(),
                storageService.getTotalStorageUsedBytes(),
                fileVaultService.getFileCount(),
                fileVaultService.getRequiredThreshold(),
                fileVaultService.getTotalShares(),
                LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }
}
