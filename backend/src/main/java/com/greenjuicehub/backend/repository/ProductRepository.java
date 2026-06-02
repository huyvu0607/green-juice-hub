package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>,
        JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlugAndIsActiveTrue(String slug);
    Page<Product> findAllByIsActiveTrue(Pageable pageable);
}