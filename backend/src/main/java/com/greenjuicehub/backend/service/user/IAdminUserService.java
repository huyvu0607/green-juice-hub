package com.greenjuicehub.backend.service.user;

import com.greenjuicehub.backend.dto.adminPromotion.response.AdminPromotionResponse;
import com.greenjuicehub.backend.dto.adminUser.request.CreatePersonalPromoRequest;
import com.greenjuicehub.backend.dto.adminUser.request.UpdateUserRoleRequest;
import com.greenjuicehub.backend.dto.adminUser.response.AdminUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IAdminUserService {

    /** Danh sách user có filter + phân trang */
    Page<AdminUserResponse> getUsers(String keyword, String role, Boolean isActive, Pageable pageable);

    /** Khoá / mở khoá tài khoản */
    AdminUserResponse toggleUserActive(Long userId);

    /** Gán role mới */
    AdminUserResponse updateRole(Long userId, UpdateUserRoleRequest request);

    /** Tạo mã khuyến mãi cá nhân cho user */
    AdminPromotionResponse createPersonalPromo(Long userId, CreatePersonalPromoRequest request);
}