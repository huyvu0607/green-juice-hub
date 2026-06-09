package com.greenjuicehub.backend.service.promotion;

import com.greenjuicehub.backend.dto.order.request.GetAvailablePromosRequest;
import com.greenjuicehub.backend.dto.order.response.AvailablePromoResponse;

import java.util.List;

public interface IPromotionService {
    List<AvailablePromoResponse> getAvailablePromos(Long userId, GetAvailablePromosRequest request);
}