package com.greenjuicehub.backend.dto.recommendation.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response trả về cho frontend sau khi AI phân tích xong.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    /**
     * Lời khuyên/giải thích ngắn gọn bằng tiếng Việt, thân thiện,
     * để hiển thị trực tiếp trong chatbot UI.
     */
    private String advice;

    /**
     * Danh sách sản phẩm được gợi ý, kèm lý do cụ thể cho từng sản phẩm.
     */
    private List<SuggestedProduct> suggestedProducts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestedProduct {
        private Long productId;
        private String name;
        private String imageUrl;
        private String slug;
        private String reason;
    }
}