package com.echovault.exception;

public class FileNotFoundException extends VaultException {
    public FileNotFoundException(String fileId) {
        super("Vault file not found with ID: " + fileId);
    }
}
