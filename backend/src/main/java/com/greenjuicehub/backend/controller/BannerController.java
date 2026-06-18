package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.banner.response.BannerResponse;
import com.greenjuicehub.backend.service.banner.IBannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {

    private final IBannerService bannerService;

    /**
     * GET /api/banners
     * Lấy banner active để hiển thị ở homepage (public)
     */
    @GetMapping
    public ResponseEntity<List<BannerResponse>> getActiveBanners() {
        return ResponseEntity.ok(bannerService.getActiveBanners());
    }
}