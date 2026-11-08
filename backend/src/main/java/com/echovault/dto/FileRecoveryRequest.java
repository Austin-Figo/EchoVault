package com.echovault.dto;

import java.util.List;

public record FileRecoveryRequest(
        List<Integer> activeShareIndices,
        boolean simulateOnly,
        Integer tamperShareIndex
) {}
