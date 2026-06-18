package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {

    /** Lấy tất cả banner đang active, sắp xếp theo sort_order */
    List<Banner> findByIsActiveTrueOrderBySortOrderAsc();

    /** Lấy tất cả banner (admin), sắp xếp theo sort_order */
    List<Banner> findAllByOrderBySortOrderAsc();
}