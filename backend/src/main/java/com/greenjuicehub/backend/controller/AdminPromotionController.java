package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.adminPromotion.request.SavePromotionRequest;
import com.greenjuicehub.backend.dto.adminPromotion.response.AdminPromotionResponse;
import com.greenjuicehub.backend.dto.adminPromotion.response.PromotionUsageResponse;
import com.greenjuicehub.backend.entity.Promotion;
import com.greenjuicehub.backend.service.promotion.IAdminPromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Theo mục 2 SRS: chỉ ADMIN quản lý khuyến mãi, STAFF không có quyền
public class AdminPromotionController {

    private final IAdminPromotionService adminPromotionService;

    @GetMapping
    public ResponseEntity<Page<AdminPromotionResponse>> getPromotions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Promotion.Target target,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                adminPromotionService.getPromotionsForAdmin(keyword, target, isActive, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminPromotionResponse> getPromotion(@PathVariable Long id) {
        return ResponseEntity.ok(adminPromotionService.getPromotionById(id));
    }

    @PostMapping
    public ResponseEntity<AdminPromotionResponse> createPromotion(
            @Valid @RequestBody SavePromotionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminPromotionService.createPromotion(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminPromotionResponse> updatePromotion(
            @PathVariable Long id,
            @Valid @RequestBody SavePromotionRequest request) {
        return ResponseEntity.ok(adminPromotionService.updatePromotion(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<Void> toggleActive(@PathVariable Long id) {
        adminPromotionService.togglePromotionActive(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/usages")
    public ResponseEntity<Page<PromotionUsageResponse>> getUsageHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminPromotionService.getUsageHistory(id, page, size));
    }
}