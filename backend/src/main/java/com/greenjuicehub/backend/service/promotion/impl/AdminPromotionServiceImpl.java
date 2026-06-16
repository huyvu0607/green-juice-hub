package com.greenjuicehub.backend.service.promotion.impl;

import com.greenjuicehub.backend.dto.adminPromotion.request.SavePromotionRequest;
import com.greenjuicehub.backend.dto.adminPromotion.response.AdminPromotionResponse;
import com.greenjuicehub.backend.dto.adminPromotion.response.PromotionUsageResponse;
import com.greenjuicehub.backend.entity.Promotion;
import com.greenjuicehub.backend.entity.User;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.PromotionMapper;
import com.greenjuicehub.backend.repository.PromotionRepository;
import com.greenjuicehub.backend.repository.PromotionUsageRepository;
import com.greenjuicehub.backend.repository.UserRepository;
import com.greenjuicehub.backend.service.promotion.IAdminPromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminPromotionServiceImpl implements IAdminPromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final UserRepository userRepository;
    private final PromotionMapper promotionMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminPromotionResponse> getPromotionsForAdmin(
            String keyword, Promotion.Target target, Boolean isActive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return promotionRepository.findAllForAdmin(kw, target, isActive, pageable)
                .map(p -> promotionMapper.toAdminResponse(p, resolveStatus(p)));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPromotionResponse getPromotionById(Long id) {
        Promotion promotion = findPromotionOrThrow(id);
        return promotionMapper.toAdminResponse(promotion, resolveStatus(promotion));
    }

    @Override
    public AdminPromotionResponse createPromotion(SavePromotionRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (promotionRepository.existsByCodeIgnoreCase(code)) {
            throw new AppException(HttpStatus.CONFLICT, "Mã khuyến mãi đã tồn tại");
        }
        validateBusinessRules(request);
        User targetUser = resolveTargetUser(request);

        Promotion promotion = Promotion.builder()
                .code(code)
                .name(request.getName())
                .type(request.getType())
                .value(request.getValue())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO)
                .freeShipping(request.getFreeShipping() != null ? request.getFreeShipping() : false)
                .target(request.getTarget())
                .user(targetUser)
                .maxUses(request.getMaxUses())
                .maxUsesPerUser(request.getMaxUsesPerUser())
                .usedCount(0)
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        promotion = promotionRepository.save(promotion);
        return promotionMapper.toAdminResponse(promotion, resolveStatus(promotion));
    }

    @Override
    public AdminPromotionResponse updatePromotion(Long id, SavePromotionRequest request) {
        Promotion promotion = findPromotionOrThrow(id);

        String code = request.getCode().trim().toUpperCase();
        if (!code.equalsIgnoreCase(promotion.getCode()) && promotionRepository.existsByCodeIgnoreCase(code)) {
            throw new AppException(HttpStatus.CONFLICT, "Mã khuyến mãi đã tồn tại");
        }
        validateBusinessRules(request);
        User targetUser = resolveTargetUser(request);

        promotion.setCode(code);
        promotion.setName(request.getName());
        promotion.setType(request.getType());
        promotion.setValue(request.getValue());
        promotion.setMinOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO);
        promotion.setFreeShipping(request.getFreeShipping() != null ? request.getFreeShipping() : false);
        promotion.setTarget(request.getTarget());
        promotion.setUser(targetUser);
        promotion.setMaxUses(request.getMaxUses());
        promotion.setMaxUsesPerUser(request.getMaxUsesPerUser());
        promotion.setStartsAt(request.getStartsAt());
        promotion.setEndsAt(request.getEndsAt());
        if (request.getIsActive() != null) promotion.setIsActive(request.getIsActive());

        promotion = promotionRepository.save(promotion);
        return promotionMapper.toAdminResponse(promotion, resolveStatus(promotion));
    }

    @Override
    public void togglePromotionActive(Long id) {
        Promotion promotion = findPromotionOrThrow(id);
        promotion.setIsActive(!promotion.getIsActive());
        promotionRepository.save(promotion);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionUsageResponse> getUsageHistory(Long promotionId, int page, int size) {
        findPromotionOrThrow(promotionId); // 404 sớm nếu mã không tồn tại
        Pageable pageable = PageRequest.of(page, size);
        return promotionUsageRepository.findAllByPromotionId(promotionId, pageable)
                .map(promotionMapper::toUsageResponse);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Promotion findPromotionOrThrow(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Mã khuyến mãi không tồn tại"));
    }

    private User resolveTargetUser(SavePromotionRequest request) {
        if (request.getTarget() == Promotion.Target.PERSONAL) {
            if (request.getUserId() == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Mã cá nhân (PERSONAL) phải chọn user");
            }
            return userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User không tồn tại"));
        }
        return null; // PUBLIC không gắn user
    }

    private void validateBusinessRules(SavePromotionRequest request) {
        if (!request.getEndsAt().isAfter(request.getStartsAt())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Thời gian kết thúc phải sau thời gian bắt đầu");
        }
        if (request.getType() == Promotion.PromotionType.PERCENT
                && request.getValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Giảm theo % không được vượt quá 100");
        }
        if (request.getMaxUsesPerUser() != null && request.getMaxUses() != null
                && request.getMaxUsesPerUser() > request.getMaxUses()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Lượt dùng mỗi user không được vượt tổng lượt dùng");
        }
    }

    private String resolveStatus(Promotion p) {
        if (!Boolean.TRUE.equals(p.getIsActive())) return "INACTIVE";
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(p.getStartsAt())) return "UPCOMING";
        if (now.isAfter(p.getEndsAt())) return "EXPIRED";
        if (p.getMaxUses() != null && p.getUsedCount() >= p.getMaxUses()) return "EXHAUSTED";
        return "RUNNING";
    }
}