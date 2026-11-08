package com.echovault.crypto;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.*;

/**
 * Shamir's Secret Sharing Scheme over GF(2^8).
 *
 * Implements a (k, n) threshold secret sharing scheme where any k shares can reconstruct
 * the secret, while any k-1 or fewer shares leak zero information about the secret.
 *
 * Security guarantees:
 * - Uses cryptographically secure random number generator (SecureRandom).
 * - Implemented over the finite Galois Field GF(2^8) with irreducible polynomial 0x11B.
 * - Independent random polynomial for each byte of the secret key.
 * - Never logs secrets, coefficients, or share payloads.
 */
@Service
public class ShamirSecretSharingService {

    private final SecureRandom secureRandom;

    public ShamirSecretSharingService() {
        this.secureRandom = new SecureRandom();
    }

    public ShamirSecretSharingService(SecureRandom secureRandom) {
        this.secureRandom = Objects.requireNonNull(secureRandom);
    }

    /**
     * Splits a secret into n shares with threshold k.
     *
     * @param secret           The original secret bytes (e.g., 32-byte AES-256 key)
     * @param threshold        The minimum number of shares needed for recovery (e.g., 3)
     * @param totalSharesCount The total number of shares to generate (e.g., 5)
     * @return List of generated SecretShare objects
     */
    public List<SecretShare> split(byte[] secret, int threshold, int totalSharesCount) {
        if (secret == null || secret.length == 0) {
            throw new IllegalArgumentException("Secret cannot be null or empty");
        }
        if (threshold < 2) {
            throw new IllegalArgumentException("Threshold must be at least 2");
        }
        if (totalSharesCount < threshold) {
            throw new IllegalArgumentException("Total shares count cannot be less than threshold");
        }
        if (totalSharesCount > 255) {
            throw new IllegalArgumentException("Total shares count cannot exceed 255 in GF(2^8)");
        }

        int secretLen = secret.length;
        byte[][] shareBuffers = new byte[totalSharesCount][secretLen];

        // For each byte of the secret, create a random polynomial of degree (threshold - 1):
        // P(x) = secret_byte + a1*x + a2*x^2 + ... + a_{k-1}*x^{k-1} in GF(2^8)
        int[] coefficients = new int[threshold];
        byte[] randomCoeffBytes = new byte[threshold - 1];

        for (int byteIdx = 0; byteIdx < secretLen; byteIdx++) {
            // Constant term is the secret byte
            coefficients[0] = secret[byteIdx] & 0xFF;

            // Generate cryptographically secure random coefficients
            secureRandom.nextBytes(randomCoeffBytes);
            for (int deg = 1; deg < threshold; deg++) {
                coefficients[deg] = randomCoeffBytes[deg - 1] & 0xFF;
            }

            // Evaluate polynomial at points x = 1, 2, ..., totalSharesCount
            for (int shareIdx = 1; shareIdx <= totalSharesCount; shareIdx++) {
                int evaluated = evaluatePolynomial(coefficients, shareIdx);
                shareBuffers[shareIdx - 1][byteIdx] = (byte) evaluated;
            }
        }

        // Package shares
        List<SecretShare> shares = new ArrayList<>(totalSharesCount);
        for (int i = 1; i <= totalSharesCount; i++) {
            shares.add(new SecretShare(i, shareBuffers[i - 1]));
        }

        return shares;
    }

    /**
     * Reconstructs the secret from a collection of shares using Lagrange polynomial interpolation at x = 0.
     *
     * @param shares    List of available secret shares
     * @param threshold Minimum number of required shares
     * @return Reconstructed secret bytes
     */
    public byte[] reconstruct(List<SecretShare> shares, int threshold) {
        if (shares == null || shares.size() < threshold) {
            int provided = (shares == null) ? 0 : shares.size();
            throw new IllegalArgumentException(
                    "Insufficient shares to reconstruct secret: provided " + provided + ", required at least " + threshold
            );
        }

        // Validate uniqueness of shares and uniform length
        Set<Integer> seenIndices = new HashSet<>();
        int expectedLen = shares.getFirst().shareData().length;
        List<SecretShare> selectedShares = new ArrayList<>();

        for (SecretShare share : shares) {
            if (share == null) continue;
            if (share.shareData().length != expectedLen) {
                throw new IllegalArgumentException("All shares must have identical length");
            }
            if (seenIndices.add(share.index())) {
                selectedShares.add(share);
                if (selectedShares.size() == threshold) {
                    // Any subset of size `threshold` is sufficient for exact reconstruction
                    break;
                }
            }
        }

        if (selectedShares.size() < threshold) {
            throw new IllegalArgumentException(
                    "Insufficient distinct shares: " + selectedShares.size() + " distinct shares provided, need " + threshold
            );
        }

        int k = selectedShares.size();
        int[] xCoords = new int[k];
        byte[][] yData = new byte[k][];

        for (int i = 0; i < k; i++) {
            xCoords[i] = selectedShares.get(i).index();
            yData[i] = selectedShares.get(i).shareData();
        }

        // Precompute Lagrange basis polynomials at x = 0:
        // L_i(0) = PROD_{j != i} (0 - x_j) / (x_i - x_j) = PROD_{j != i} x_j / (x_i ^ x_j)
        int[] lagrangeBasis = new int[k];
        for (int i = 0; i < k; i++) {
            int li = 1;
            int xi = xCoords[i];
            for (int j = 0; j < k; j++) {
                if (i != j) {
                    int xj = xCoords[j];
                    int num = xj;
                    int den = GF256.add(xi, xj); // in GF(2^8), subtraction is XOR
                    li = GF256.multiply(li, GF256.divide(num, den));
                }
            }
            lagrangeBasis[i] = li;
        }

        // Interpolate secret at x = 0:
        // S_b = SUM_{i=0}^{k-1} (y_{i,b} * L_i(0))
        byte[] reconstructedSecret = new byte[expectedLen];
        for (int b = 0; b < expectedLen; b++) {
            int reconstructedByte = 0;
            for (int i = 0; i < k; i++) {
                int yi = yData[i][b] & 0xFF;
                int term = GF256.multiply(yi, lagrangeBasis[i]);
                reconstructedByte = GF256.add(reconstructedByte, term);
            }
            reconstructedSecret[b] = (byte) reconstructedByte;
        }

        return reconstructedSecret;
    }

    /**
     * Evaluates a polynomial P(x) = c0 + c1*x + c2*x^2 + ... in GF(2^8) using Horner's method.
     */
    private int evaluatePolynomial(int[] coefficients, int x) {
        int result = 0;
        for (int deg = coefficients.length - 1; deg >= 0; deg--) {
            result = GF256.multiply(result, x);
            result = GF256.add(result, coefficients[deg]);
        }
        return result;
    }
}
