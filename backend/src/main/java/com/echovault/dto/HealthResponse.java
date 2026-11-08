package com.echovault.dto;

import java.time.LocalDateTime;

public record HealthResponse(
        String status,
        String activeDatabase,
        String storagePath,
        long storageUsedBytes,
        long fileCount,
        int thresholdRequired,
        int totalShares,
        LocalDateTime timestamp
) {}
