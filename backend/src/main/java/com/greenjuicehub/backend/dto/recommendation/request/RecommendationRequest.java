package com.greenjuicehub.backend.dto.recommendation.request;

import java.util.List;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request cho AI gợi ý sản phẩm. Hỗ trợ 2 luồng:
 * 1) Chatbot tự do: chỉ cần điền `message`
 * 2) Form trắc nghiệm: điền `goals`, `preferences`, `avoidIngredients`
 * Có thể kết hợp cả hai cùng lúc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequest {

    /**
     * Câu hỏi/mô tả nhu cầu tự do của người dùng.
     * Ví dụ: "Tôi hay mất ngủ và khó tiêu, có nước ép nào hợp không?"
     */
    @Size(max = 1000, message = "Nội dung tối đa 1000 ký tự")
    private String message;

    /**
     * Mục tiêu sức khỏe được chọn từ form (nếu có).
     * Ví dụ: ["giảm cân", "detox", "tăng đề kháng"]
     */
    private List<String> goals;

    /**
     * Sở thích khẩu vị. Ví dụ: ["ít ngọt", "vị chua", "không cay"]
     */
    private List<String> preferences;

    /**
     * Nguyên liệu cần tránh (dị ứng). Ví dụ: ["dứa", "hạt óc chó"]
     */
    private List<String> avoidIngredients;

    /**
     * Ngân sách tối đa (VNĐ), optional
     */
    private Long maxBudget;
}