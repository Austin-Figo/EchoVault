package com.echovault.dto;

import java.time.LocalDateTime;
import java.util.List;

public record FileMetadataDto(
        String id,
        String originalFileName,
        String contentType,
        long fileSize,
        String checksumSha256,
        LocalDateTime createdAt,
        int totalShares,
        int thresholdRequired,
        boolean isRecoverable,
        List<ShareNodeDto> shares
) {}
