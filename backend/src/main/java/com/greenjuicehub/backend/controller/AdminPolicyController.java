package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.policy.request.SavePolicyRequest;
import com.greenjuicehub.backend.dto.policy.response.PolicyResponse;
import com.greenjuicehub.backend.service.policy.IAdminPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/policies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPolicyController {

    private final IAdminPolicyService adminPolicyService;

    /**
     * GET /api/admin/policies
     * Lấy tất cả chính sách (kể cả inactive) — dùng cho trang quản trị
     */
    @GetMapping
    public ResponseEntity<List<PolicyResponse>> getAllForAdmin() {
        return ResponseEntity.ok(adminPolicyService.getAllForAdmin());
    }

    /**
     * GET /api/admin/policies/{id}
     * Lấy chi tiết 1 chính sách — dùng khi mở form edit
     */
    @GetMapping("/{id}")
    public ResponseEntity<PolicyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(adminPolicyService.getById(id));
    }

    /**
     * POST /api/admin/policies
     * Tạo chính sách mới (thường chỉ dùng khi seed data lần đầu,
     * vì mỗi type chỉ có 1 bản ghi theo UNIQUE constraint)
     */
    @PostMapping
    public ResponseEntity<PolicyResponse> create(
            @Valid @RequestBody SavePolicyRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminPolicyService.create(request));
    }

    /**
     * PUT /api/admin/policies/{id}
     * Cập nhật nội dung chính sách
     */
    @PutMapping("/{id}")
    public ResponseEntity<PolicyResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SavePolicyRequest request
    ) {
        return ResponseEntity.ok(adminPolicyService.update(id, request));
    }

    /**
     * PATCH /api/admin/policies/{id}/toggle-active
     * Bật / tắt hiển thị chính sách trên trang public
     */
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<PolicyResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(adminPolicyService.toggleActive(id));
    }
}