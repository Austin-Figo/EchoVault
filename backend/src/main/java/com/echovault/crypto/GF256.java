package com.echovault.crypto;

/**
 * Finite Field GF(2^8) arithmetic implementation using the Rijndael irreducible polynomial:
 * m(x) = x^8 + x^4 + x^3 + x + 1 (0x11B).
 *
 * Provides addition, subtraction, multiplication, division, and multiplicative inversion.
 */
public final class GF256 {

    private static final int[] EXP = new int[512];
    private static final int[] LOG = new int[256];

    static {
        // Generator alpha = 3 (0x03) generates all 255 non-zero elements of GF(256)
        int x = 1;
        for (int i = 0; i < 255; i++) {
            EXP[i] = x;
            EXP[i + 255] = x;
            LOG[x] = i;
            x = multiplyUncached(x, 3);
        }
        EXP[255] = EXP[0];
        EXP[510] = EXP[255];
    }

    private GF256() {
        // Utility class
    }

    /**
     * Bitwise multiplication modulo 0x11B (Russian Peasant algorithm) used strictly to populate tables.
     */
    private static int multiplyUncached(int a, int b) {
        int p = 0;
        for (int i = 0; i < 8; i++) {
            if ((b & 1) != 0) {
                p ^= a;
            }
            boolean hiBit = (a & 0x80) != 0;
            a = (a << 1) & 0xFF;
            if (hiBit) {
                a ^= 0x1B;
            }
            b >>= 1;
        }
        return p;
    }

    /**
     * Addition in GF(2^8) is bitwise XOR.
     */
    public static int add(int a, int b) {
        return (a ^ b) & 0xFF;
    }

    /**
     * Subtraction in GF(2^8) is identical to addition (bitwise XOR).
     */
    public static int subtract(int a, int b) {
        return (a ^ b) & 0xFF;
    }

    /**
     * Multiplication in GF(2^8) using lookup tables for constant-time complexity.
     */
    public static int multiply(int a, int b) {
        int valA = a & 0xFF;
        int valB = b & 0xFF;
        if (valA == 0 || valB == 0) {
            return 0;
        }
        return EXP[LOG[valA] + LOG[valB]];
    }

    /**
     * Division in GF(2^8).
     */
    public static int divide(int a, int b) {
        int valA = a & 0xFF;
        int valB = b & 0xFF;
        if (valB == 0) {
            throw new ArithmeticException("Division by zero in GF(256)");
        }
        if (valA == 0) {
            return 0;
        }
        int diff = LOG[valA] - LOG[valB];
        if (diff < 0) {
            diff += 255;
        }
        return EXP[diff];
    }

    /**
     * Multiplicative inverse in GF(2^8).
     */
    public static int inverse(int a) {
        int val = a & 0xFF;
        if (val == 0) {
            throw new ArithmeticException("Zero has no multiplicative inverse in GF(256)");
        }
        return EXP[255 - LOG[val]];
    }
}
