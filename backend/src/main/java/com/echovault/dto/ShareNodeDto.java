package com.echovault.dto;

import java.time.LocalDateTime;

public record ShareNodeDto(
        int shareIndex,
        String nodeName,
        String status,
        LocalDateTime storedAt
) {}
