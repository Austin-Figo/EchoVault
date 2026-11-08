package com.echovault.dto;

import java.util.List;

public record FileRecoverySimulationResponse(
        boolean success,
        String message,
        List<Integer> sharesUsed,
        int thresholdRequired,
        boolean thresholdMet,
        boolean authenticationVerified,
        long fileSize,
        String fileName
) {}
