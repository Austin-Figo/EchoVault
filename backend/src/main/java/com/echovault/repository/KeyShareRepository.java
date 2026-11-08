package com.echovault.repository;

import com.echovault.entity.KeyShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KeyShareRepository extends JpaRepository<KeyShare, Long> {
    List<KeyShare> findByVaultFileIdOrderByShareIndexAsc(String vaultFileId);
}
