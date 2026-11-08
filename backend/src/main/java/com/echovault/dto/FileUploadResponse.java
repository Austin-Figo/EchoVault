package com.echovault.dto;

import java.util.List;

public record FileUploadResponse(
        String id,
        String fileName,
        long fileSize,
        String message,
        int totalSharesGenerated,
        int recoveryThreshold,
        List<ShareNodeDto> shares
) {}
