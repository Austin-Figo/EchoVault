package com.echovault.crypto;

import java.util.Arrays;
import java.util.Base64;
import java.util.Objects;

/**
 * Represents a single Shamir secret share with an evaluation point (index) and share payload.
 */
public record SecretShare(int index, byte[] shareData) {

    public SecretShare {
        if (index <= 0 || index > 255) {
            throw new IllegalArgumentException("Share index must be between 1 and 255");
        }
        Objects.requireNonNull(shareData, "Share data cannot be null");
        // Create defensive copy
        shareData = shareData.clone();
    }

    @Override
    public byte[] shareData() {
        return shareData.clone();
    }

    public String toBase64() {
        return Base64.getEncoder().encodeToString(shareData);
    }

    public static SecretShare fromBase64(int index, String base64Data) {
        Objects.requireNonNull(base64Data, "base64Data cannot be null");
        byte[] decoded = Base64.getDecoder().decode(base64Data);
        return new SecretShare(index, decoded);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SecretShare that)) return false;
        return index == that.index && Arrays.equals(shareData, that.shareData);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(index);
        result = 31 * result + Arrays.hashCode(shareData);
        return result;
    }

    @Override
    public String toString() {
        // Safe representation without logging cryptographic share bytes
        return "SecretShare[index=" + index + ", length=" + shareData.length + " bytes]";
    }
}
