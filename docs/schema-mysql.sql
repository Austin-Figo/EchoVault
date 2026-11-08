-- EchoVault MySQL Database Schema DDL
-- Database: echovault

CREATE DATABASE IF NOT EXISTS `echovault` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `echovault`;

-- Table: vault_files
CREATE TABLE IF NOT EXISTS `vault_files` (
    `id` VARCHAR(36) NOT NULL,
    `original_file_name` VARCHAR(255) NOT NULL,
    `sanitized_storage_name` VARCHAR(255) NOT NULL,
    `content_type` VARCHAR(128) DEFAULT NULL,
    `file_size` BIGINT NOT NULL,
    `storage_path` VARCHAR(512) NOT NULL,
    `iv_base64` VARCHAR(64) NOT NULL,
    `checksum_sha256` VARCHAR(64) NOT NULL,
    `created_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: key_shares
CREATE TABLE IF NOT EXISTS `key_shares` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `vault_file_id` VARCHAR(36) NOT NULL,
    `share_index` INT NOT NULL,
    `node_name` VARCHAR(64) NOT NULL,
    `share_data` LONGTEXT NOT NULL,
    `created_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_share_file_id` (`vault_file_id`),
    CONSTRAINT `fk_key_shares_vault_file` FOREIGN KEY (`vault_file_id`) REFERENCES `vault_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
