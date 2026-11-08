package com.echovault.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ShamirSecretSharingServiceTest {

    private ShamirSecretSharingService shamirService;
    private SecureRandom random;

    @BeforeEach
    void setUp() {
        random = new SecureRandom();
        shamirService = new ShamirSecretSharingService(random);
    }

    @Test
    @DisplayName("Splits 32-byte AES key into 5 shares with threshold 3")
    void testSplitParameters() {
        byte[] secret = new byte[32];
        random.nextBytes(secret);

        List<SecretShare> shares = shamirService.split(secret, 3, 5);
        assertEquals(5, shares.size());

        for (int i = 0; i < 5; i++) {
            assertEquals(i + 1, shares.get(i).index());
            assertEquals(32, shares.get(i).shareData().length);
            // Verify share is not equal to original secret
            assertFalse(Arrays.equals(secret, shares.get(i).shareData()));
        }
    }

    @Test
    @DisplayName("Proves that ALL 10 possible combinations of 3 shares recover the original key exactly")
    void testAllTen3Of5CombinationsRecoverSecret() {
        byte[] secret = new byte[32];
        random.nextBytes(secret);

        List<SecretShare> shares = shamirService.split(secret, 3, 5);

        int[][] combinations = {
                {0, 1, 2}, // {1, 2, 3}
                {0, 1, 3}, // {1, 2, 4}
                {0, 1, 4}, // {1, 2, 5}
                {0, 2, 3}, // {1, 3, 4}
                {0, 2, 4}, // {1, 3, 5}
                {0, 3, 4}, // {1, 4, 5}
                {1, 2, 3}, // {2, 3, 4}
                {1, 2, 4}, // {2, 3, 5}
                {1, 3, 4}, // {2, 4, 5}
                {2, 3, 4}  // {3, 4, 5}
        };

        for (int[] combo : combinations) {
            List<SecretShare> subset = List.of(shares.get(combo[0]), shares.get(combo[1]), shares.get(combo[2]));
            byte[] recovered = shamirService.reconstruct(subset, 3);
            assertArrayEquals(secret, recovered,
                    () -> "Failed to recover secret with shares: " + (combo[0]+1) + ", " + (combo[1]+1) + ", " + (combo[2]+1));
        }
    }

    @Test
    @DisplayName("Proves that any 4 shares and all 5 shares recover the original key")
    void testFourAndFiveSharesRecoverSecret() {
        byte[] secret = new byte[32];
        random.nextBytes(secret);

        List<SecretShare> shares = shamirService.split(secret, 3, 5);

        // 4 shares
        List<SecretShare> fourShares = List.of(shares.get(0), shares.get(1), shares.get(2), shares.get(4));
        byte[] recovered4 = shamirService.reconstruct(fourShares, 3);
        assertArrayEquals(secret, recovered4);

        // All 5 shares
        byte[] recovered5 = shamirService.reconstruct(shares, 3);
        assertArrayEquals(secret, recovered5);
    }

    @Test
    @DisplayName("Proves that any 2 shares fail to satisfy the threshold requirement")
    void testAnyTwoSharesFailThreshold() {
        byte[] secret = new byte[32];
        random.nextBytes(secret);

        List<SecretShare> shares = shamirService.split(secret, 3, 5);

        // Test every pair of 2 shares: must throw IllegalArgumentException
        for (int i = 0; i < 5; i++) {
            for (int j = i + 1; j < 5; j++) {
                List<SecretShare> pair = List.of(shares.get(i), shares.get(j));
                assertThrows(IllegalArgumentException.class, () -> shamirService.reconstruct(pair, 3),
                        "Reconstruction with only 2 shares must be rejected");
            }
        }
    }

    @Test
    @DisplayName("Proves that 1 share or empty list fails threshold requirement")
    void testInsufficientSharesFail() {
        byte[] secret = new byte[32];
        random.nextBytes(secret);

        List<SecretShare> shares = shamirService.split(secret, 3, 5);

        assertThrows(IllegalArgumentException.class, () -> shamirService.reconstruct(List.of(shares.getFirst()), 3));
        assertThrows(IllegalArgumentException.class, () -> shamirService.reconstruct(List.of(), 3));
        assertThrows(IllegalArgumentException.class, () -> shamirService.reconstruct(null, 3));
    }

    @Test
    @DisplayName("Corrupted share produces wrong reconstructed key")
    void testCorruptedShareProducesWrongKey() {
        byte[] secret = new byte[32];
        random.nextBytes(secret);

        List<SecretShare> shares = shamirService.split(secret, 3, 5);

        // Tamper with share 1
        byte[] tamperedData = shares.get(0).shareData();
        tamperedData[0] ^= 0x7F;
        SecretShare tamperedShare = new SecretShare(shares.get(0).index(), tamperedData);

        List<SecretShare> subset = List.of(tamperedShare, shares.get(1), shares.get(2));
        byte[] recovered = shamirService.reconstruct(subset, 3);

        assertFalse(Arrays.equals(secret, recovered), "Reconstructed key with tampered share must NOT match original key");
    }
}
