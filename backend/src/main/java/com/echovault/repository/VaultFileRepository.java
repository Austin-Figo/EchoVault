package com.echovault.repository;

import com.echovault.entity.VaultFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaultFileRepository extends JpaRepository<VaultFile, String> {
    List<VaultFile> findAllByOrderByCreatedAtDesc();
}
