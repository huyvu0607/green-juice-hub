package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.ShippingPolicy;
import com.greenjuicehub.backend.entity.ShippingPolicy.PolicyType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PolicyRepository extends JpaRepository<ShippingPolicy, Long> {
    Optional<ShippingPolicy> findByTypeAndIsActiveTrue(PolicyType type);
    List<ShippingPolicy> findAllByIsActiveTrueOrderBySortOrderAsc();
}