package com.greenjuicehub.backend.service.promotion;

import com.greenjuicehub.backend.dto.adminPromotion.request.SavePromotionRequest;
import com.greenjuicehub.backend.dto.adminPromotion.response.AdminPromotionResponse;
import com.greenjuicehub.backend.dto.adminPromotion.response.PromotionUsageResponse;
import com.greenjuicehub.backend.entity.Promotion;
import org.springframework.data.domain.Page;

public interface IAdminPromotionService {

    Page<AdminPromotionResponse> getPromotionsForAdmin(
            String keyword, Promotion.Target target, Boolean isActive, int page, int size);

    AdminPromotionResponse getPromotionById(Long id);

    AdminPromotionResponse createPromotion(SavePromotionRequest request);

    AdminPromotionResponse updatePromotion(Long id, SavePromotionRequest request);

    void togglePromotionActive(Long id);

    Page<PromotionUsageResponse> getUsageHistory(Long promotionId, int page, int size);
}