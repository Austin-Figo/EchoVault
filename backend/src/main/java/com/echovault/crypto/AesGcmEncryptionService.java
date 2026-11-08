package com.echovault.crypto;

import com.echovault.exception.DecryptionFailedException;
import com.echovault.exception.VaultException;
import org.springframework.stereotype.Service;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Objects;

/**
 * Service providing authenticated AES-256-GCM encryption and decryption.
 *
 * Guarantees:
 * - Uses 256-bit AES keys generated via SecureRandom.
 * - Uses 96-bit (12-byte) random nonces (IVs) generated per encryption operation.
 * - Uses 128-bit authentication tags to verify ciphertext integrity and authenticity.
 * - Detects tampering or corrupted keys via AEADBadTagException.
 * - Never logs key material or plaintext data.
 */
@Service
public class AesGcmEncryptionService {

    public static final int AES_KEY_SIZE_BITS = 256;
    public static final int AES_KEY_SIZE_BYTES = AES_KEY_SIZE_BITS / 8; // 32 bytes
    public static final int GCM_IV_SIZE_BYTES = 12; // 96 bits standard for GCM
    public static final int GCM_TAG_LENGTH_BITS = 128; // 128-bit authentication tag

    private final SecureRandom secureRandom;

    public AesGcmEncryptionService() {
        this.secureRandom = new SecureRandom();
    }

    public AesGcmEncryptionService(SecureRandom secureRandom) {
        this.secureRandom = Objects.requireNonNull(secureRandom);
    }

    /**
     * Generates a cryptographically secure 256-bit random AES key.
     */
    public byte[] generateAesKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance("AES");
            keyGen.init(AES_KEY_SIZE_BITS, secureRandom);
            SecretKey secretKey = keyGen.generateKey();
            return secretKey.getEncoded();
        } catch (NoSuchAlgorithmException e) {
            byte[] keyBytes = new byte[AES_KEY_SIZE_BYTES];
            secureRandom.nextBytes(keyBytes);
            return keyBytes;
        }
    }

    /**
     * Generates a random 12-byte nonce (IV) for AES-GCM.
     */
    public byte[] generateIv() {
        byte[] iv = new byte[GCM_IV_SIZE_BYTES];
        secureRandom.nextBytes(iv);
        return iv;
    }

    /**
     * Encrypts plaintext bytes using AES-256-GCM.
     *
     * @param plainText The unencrypted input bytes
     * @param keyBytes  The 256-bit AES key bytes
     * @param iv        The 12-byte nonce/IV
     * @return The encrypted ciphertext including the 128-bit authentication tag
     */
    public byte[] encrypt(byte[] plainText, byte[] keyBytes, byte[] iv) {
        Objects.requireNonNull(plainText, "plainText cannot be null");
        Objects.requireNonNull(keyBytes, "keyBytes cannot be null");
        Objects.requireNonNull(iv, "iv cannot be null");

        if (keyBytes.length != AES_KEY_SIZE_BYTES) {
            throw new IllegalArgumentException("AES key must be exactly 32 bytes (256 bits)");
        }
        if (iv.length != GCM_IV_SIZE_BYTES) {
            throw new IllegalArgumentException("GCM IV must be exactly 12 bytes");
        }

        try {
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, parameterSpec);
            return cipher.doFinal(plainText);
        } catch (Exception e) {
            throw new VaultException("Encryption operation failed", e);
        }
    }

    /**
     * Decrypts ciphertext bytes using AES-256-GCM and verifies authentication tag.
     *
     * @param cipherText The encrypted data with authentication tag
     * @param keyBytes   The 256-bit AES key bytes
     * @param iv         The 12-byte nonce/IV
     * @return Decrypted plaintext bytes
     * @throws DecryptionFailedException if authentication tag check fails (tampered data or wrong key)
     */
    public byte[] decrypt(byte[] cipherText, byte[] keyBytes, byte[] iv) {
        Objects.requireNonNull(cipherText, "cipherText cannot be null");
        Objects.requireNonNull(keyBytes, "keyBytes cannot be null");
        Objects.requireNonNull(iv, "iv cannot be null");

        if (keyBytes.length != AES_KEY_SIZE_BYTES) {
            throw new IllegalArgumentException("AES key must be exactly 32 bytes (256 bits)");
        }
        if (iv.length != GCM_IV_SIZE_BYTES) {
            throw new IllegalArgumentException("GCM IV must be exactly 12 bytes");
        }

        try {
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, keySpec, parameterSpec);
            return cipher.doFinal(cipherText);
        } catch (AEADBadTagException e) {
            throw new DecryptionFailedException(
                    "AES-GCM authentication verification failed: Ciphertext has been tampered with or reconstructed key is invalid.", e
            );
        } catch (Exception e) {
            throw new DecryptionFailedException("Decryption error: " + e.getMessage(), e);
        }
    }

    /**
     * Computes SHA-256 hex digest for audit and data integrity checking.
     */
    public String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new VaultException("SHA-256 digest algorithm unavailable", e);
        }
    }
}
