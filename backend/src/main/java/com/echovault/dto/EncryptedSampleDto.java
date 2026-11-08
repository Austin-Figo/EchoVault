package com.echovault.dto;

public record EncryptedSampleDto(
        String id,
        String fileName,
        long originalFileSize,
        long encryptedSizeBytes,
        String ivBase64,
        String checksumSha256,
        String sampleHex,
        double shannonEntropy,
        String storagePath
) {}
