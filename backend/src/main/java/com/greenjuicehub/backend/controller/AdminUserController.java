package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.PageResponse;
import com.greenjuicehub.backend.dto.adminPromotion.response.AdminPromotionResponse;
import com.greenjuicehub.backend.dto.adminUser.request.CreatePersonalPromoRequest;
import com.greenjuicehub.backend.dto.adminUser.request.UpdateUserRoleRequest;
import com.greenjuicehub.backend.dto.adminUser.response.AdminUserResponse;
import com.greenjuicehub.backend.service.user.IAdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final IAdminUserService adminUserService;

    /**
     * GET /api/admin/users?keyword=&role=&isActive=&page=0&size=20
     * Danh sách user với filter + phân trang
     */
    @GetMapping
    public ResponseEntity<PageResponse<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                PageResponse.from(adminUserService.getUsers(keyword, role, isActive, pageable))
        );
    }

    /**
     * PATCH /api/admin/users/{userId}/toggle-active
     * Khoá / mở khoá tài khoản
     */
    @PatchMapping("/{userId}/toggle-active")
    public ResponseEntity<AdminUserResponse> toggleActive(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserService.toggleUserActive(userId));
    }

    /**
     * PATCH /api/admin/users/{userId}/role
     * Gán role mới (CUSTOMER / STAFF / ADMIN)
     */
    @PatchMapping("/{userId}/role")
    public ResponseEntity<AdminUserResponse> updateRole(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return ResponseEntity.ok(adminUserService.updateRole(userId, request));
    }

    /**
     * POST /api/admin/users/{userId}/personal-promos
     * Tạo mã khuyến mãi cá nhân cho user cụ thể
     */
    @PostMapping("/{userId}/personal-promos")
    public ResponseEntity<AdminPromotionResponse> createPersonalPromo(
            @PathVariable Long userId,
            @Valid @RequestBody CreatePersonalPromoRequest request
    ) {
        return ResponseEntity.ok(adminUserService.createPersonalPromo(userId, request));
    }
}