package com.echovault.exception;

public class DecryptionFailedException extends VaultException {
    public DecryptionFailedException(String message) {
        super(message);
    }

    public DecryptionFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}
