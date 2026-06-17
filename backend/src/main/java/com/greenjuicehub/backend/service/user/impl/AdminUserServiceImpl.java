package com.greenjuicehub.backend.service.user.impl;

import com.greenjuicehub.backend.dto.adminPromotion.response.AdminPromotionResponse;
import com.greenjuicehub.backend.dto.adminUser.request.CreatePersonalPromoRequest;
import com.greenjuicehub.backend.dto.adminUser.request.UpdateUserRoleRequest;
import com.greenjuicehub.backend.dto.adminUser.response.AdminUserResponse;
import com.greenjuicehub.backend.entity.Promotion;
import com.greenjuicehub.backend.entity.User;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.PromotionMapper;
import com.greenjuicehub.backend.repository.PromotionRepository;
import com.greenjuicehub.backend.repository.UserRepository;
import com.greenjuicehub.backend.service.user.IAdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements IAdminUserService {

    private final UserRepository userRepository;
    private final PromotionRepository promotionRepository;
    private final PromotionMapper promotionMapper;

    // ── List ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(String keyword, String role, Boolean isActive, Pageable pageable) {
        return userRepository
                .findByFilters(keyword, role, isActive, pageable)
                .map(this::toResponse);
    }

    // ── Toggle active ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AdminUserResponse toggleUserActive(Long userId) {
        User user = findOrThrow(userId);
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        return toResponse(user);
    }

    // ── Update role ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AdminUserResponse updateRole(Long userId, UpdateUserRoleRequest request) {
        User user = findOrThrow(userId);

        User.Role newRole;
        try {
            newRole = User.Role.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Role không hợp lệ: " + request.getRole());
        }

        user.setRole(newRole);
        userRepository.save(user);
        return toResponse(user);
    }

    // ── Create personal promo ─────────────────────────────────────────────────

    @Override
    @Transactional
    public AdminPromotionResponse createPersonalPromo(Long userId, CreatePersonalPromoRequest request) {
        User user = findOrThrow(userId);

        // FIX 1: dùng existsByCodeIgnoreCase (method thực tế trong repo)
        if (promotionRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Mã khuyến mãi '" + request.getCode() + "' đã tồn tại");
        }

        // FIX 2: enum đúng là PromotionType, không phải Type
        Promotion.PromotionType promoType;
        try {
            promoType = Promotion.PromotionType.valueOf(request.getType());
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Loại mã không hợp lệ (PERCENT / FIXED)");
        }

        Promotion promo = Promotion.builder()
                .code(request.getCode().toUpperCase().trim())
                .name(request.getName())
                .type(promoType)
                .value(request.getValue())
                .minOrderValue(request.getMinOrderValue())
                .freeShipping(Boolean.TRUE.equals(request.getFreeShipping()))
                .target(Promotion.Target.PERSONAL)
                .user(user)
                .maxUses(null)                        // PERSONAL → không giới hạn tổng
                .maxUsesPerUser(request.getMaxUsesPerUser())
                .usedCount(0)
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .isActive(true)
                .build();

        promotionRepository.save(promo);

        // FIX 3: toAdminResponse cần 2 tham số (Promotion, String status)
        String status = resolveStatus(promo);
        return promotionMapper.toAdminResponse(promo, status);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Người dùng không tồn tại"));
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .hasPassword(user.getHasPassword())
                // FIX 4: createdAt / phoneVerifiedAt đã là LocalDateTime, không cần toLocalDateTime()
                .phoneVerifiedAt(user.getPhoneVerifiedAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /** Tính status string giống AdminPromotionServiceImpl */
    private String resolveStatus(Promotion p) {
        LocalDateTime now = LocalDateTime.now();
        if (!p.getIsActive()) return "INACTIVE";
        if (now.isBefore(p.getStartsAt())) return "UPCOMING";
        if (now.isAfter(p.getEndsAt())) return "EXPIRED";
        if (p.getMaxUses() != null && p.getUsedCount() >= p.getMaxUses()) return "EXHAUSTED";
        return "ACTIVE";
    }
}