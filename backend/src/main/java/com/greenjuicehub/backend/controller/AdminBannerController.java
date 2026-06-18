package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.banner.request.SaveBannerRequest;
import com.greenjuicehub.backend.dto.banner.response.BannerResponse;
import com.greenjuicehub.backend.service.banner.IBannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBannerController {

    private final IBannerService bannerService;

    /**
     * GET /api/admin/banners
     * Lấy tất cả banner (có cả inactive)
     */
    @GetMapping
    public ResponseEntity<List<BannerResponse>> getAllBanners() {
        return ResponseEntity.ok(bannerService.getAllBanners());
    }

    /**
     * POST /api/admin/banners
     * Tạo banner mới
     */
    @PostMapping
    public ResponseEntity<BannerResponse> createBanner(
            @Valid @RequestBody SaveBannerRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bannerService.createBanner(request));
    }

    /**
     * PUT /api/admin/banners/{id}
     * Cập nhật banner
     */
    @PutMapping("/{id}")
    public ResponseEntity<BannerResponse> updateBanner(
            @PathVariable Long id,
            @Valid @RequestBody SaveBannerRequest request
    ) {
        return ResponseEntity.ok(bannerService.updateBanner(id, request));
    }

    /**
     * DELETE /api/admin/banners/{id}
     * Xoá banner
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/admin/banners/{id}/toggle-active
     * Bật / tắt hiển thị
     */
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<BannerResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(bannerService.toggleActive(id));
    }
}