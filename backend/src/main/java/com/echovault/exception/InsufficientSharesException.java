package com.echovault.exception;

public class InsufficientSharesException extends VaultException {
    public InsufficientSharesException(int provided, int required) {
        super(String.format("Threshold not met: at least %d shares are required to reconstruct the encryption key, but only %d were provided.", required, provided));
    }

    public InsufficientSharesException(String message) {
        super(message);
    }
}
