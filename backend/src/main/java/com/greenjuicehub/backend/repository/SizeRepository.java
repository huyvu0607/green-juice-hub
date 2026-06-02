package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SizeRepository extends JpaRepository<Size, Long> {
    List<Size> findAllByIsActiveTrueOrderByNameAsc();
}