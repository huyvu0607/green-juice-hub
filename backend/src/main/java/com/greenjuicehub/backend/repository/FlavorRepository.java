package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Flavor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FlavorRepository extends JpaRepository<Flavor, Long> {
    List<Flavor> findAllByIsActiveTrueOrderByNameAsc();
}