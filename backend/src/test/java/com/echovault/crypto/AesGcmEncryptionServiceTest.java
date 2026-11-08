package com.echovault.crypto;

import com.echovault.exception.DecryptionFailedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class AesGcmEncryptionServiceTest {

    private AesGcmEncryptionService aesService;

    @BeforeEach
    void setUp() {
        aesService = new AesGcmEncryptionService();
    }

    @Test
    @DisplayName("AES-GCM encryption and decryption round-trip restores exact original plaintext")
    void testRoundTrip() {
        byte[] key = aesService.generateAesKey();
        byte[] iv = aesService.generateIv();
        byte[] original = "EchoVault confidential military-grade payload 123456789".getBytes(StandardCharsets.UTF_8);

        byte[] cipherText = aesService.encrypt(original, key, iv);
        assertNotNull(cipherText);
        assertFalse(Arrays.equals(original, cipherText));

        byte[] decrypted = aesService.decrypt(cipherText, key, iv);
        assertArrayEquals(original, decrypted);
    }

    @Test
    @DisplayName("AES-GCM tag verification rejects corrupted ciphertext")
    void testCorruptedCiphertextRejected() {
        byte[] key = aesService.generateAesKey();
        byte[] iv = aesService.generateIv();
        byte[] original = "Secret document bytes".getBytes(StandardCharsets.UTF_8);

        byte[] cipherText = aesService.encrypt(original, key, iv);

        // Corrupt a byte in the middle of ciphertext
        byte[] tampered = cipherText.clone();
        tampered[tampered.length / 2] ^= 0x55;

        assertThrows(DecryptionFailedException.class, () -> aesService.decrypt(tampered, key, iv));
    }

    @Test
    @DisplayName("AES-GCM rejects decryption when incorrect key is provided")
    void testWrongKeyRejected() {
        byte[] key1 = aesService.generateAesKey();
        byte[] key2 = aesService.generateAesKey();
        byte[] iv = aesService.generateIv();
        byte[] original = "Confidential data payload".getBytes(StandardCharsets.UTF_8);

        byte[] cipherText = aesService.encrypt(original, key1, iv);

        assertThrows(DecryptionFailedException.class, () -> aesService.decrypt(cipherText, key2, iv));
    }

    @Test
    @DisplayName("AES-GCM rejects decryption when incorrect IV is provided")
    void testWrongIvRejected() {
        byte[] key = aesService.generateAesKey();
        byte[] iv1 = aesService.generateIv();
        byte[] iv2 = aesService.generateIv();
        byte[] original = "Confidential data payload".getBytes(StandardCharsets.UTF_8);

        byte[] cipherText = aesService.encrypt(original, key, iv1);

        assertThrows(DecryptionFailedException.class, () -> aesService.decrypt(cipherText, key, iv2));
    }

    @Test
    @DisplayName("Generates unique IVs on successive calls")
    void testUniqueIvs() {
        byte[] iv1 = aesService.generateIv();
        byte[] iv2 = aesService.generateIv();
        assertFalse(Arrays.equals(iv1, iv2));
    }

    @Test
    @DisplayName("Computes deterministic SHA-256 hash")
    void testSha256Checksum() {
        byte[] data = "Hello EchoVault".getBytes(StandardCharsets.UTF_8);
        String hash1 = aesService.computeSha256(data);
        String hash2 = aesService.computeSha256(data);
        assertEquals(hash1, hash2);
        assertEquals(64, hash1.length());
    }
}
