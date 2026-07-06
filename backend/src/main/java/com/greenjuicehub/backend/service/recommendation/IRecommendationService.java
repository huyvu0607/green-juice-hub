package com.greenjuicehub.backend.service.recommendation;

import com.greenjuicehub.backend.dto.recommendation.request.RecommendationRequest;
import com.greenjuicehub.backend.dto.recommendation.response.RecommendationResponse;

public interface IRecommendationService {

    /**
     * Phân tích nhu cầu người dùng và trả về gợi ý sản phẩm phù hợp.
     */
    RecommendationResponse recommend(RecommendationRequest request);
}