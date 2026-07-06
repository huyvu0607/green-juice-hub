package com.greenjuicehub.backend.service.recommendation.prompt;

import java.util.List;

import org.springframework.stereotype.Component;

import com.greenjuicehub.backend.dto.recommendation.request.RecommendationRequest;
import com.greenjuicehub.backend.entity.Product;

/**
 * Nơi định nghĩa RULE cho AI — đây chính là phần "train" mà không cần fine-tune.
 * Mọi chỉnh sửa về cách AI tư vấn, giọng điệu, ràng buộc... đều sửa ở đây.
 *
 * Ý tưởng: System Prompt (rule cố định) + Context data (RAG - danh sách sản phẩm
 * thật lấy từ DB) + Input người dùng (form/chat) => Gemini chỉ được chọn trong
 * phạm vi sản phẩm có thật, không được bịa.
 */
@Component
public class RecommendationPromptBuilder {

    /**
     * ====== RULE CHO AI (system instruction) ======
     * Đây là phần bạn chỉnh để "dạy" AI cách cư xử. Muốn AI nghiêm khắc hơn,
     * nói chuyện khác giọng, thêm ràng buộc mới... sửa trực tiếp trong text này.
     */
    private static final String SYSTEM_RULES = """
            Bạn là trợ lý tư vấn dinh dưỡng của cửa hàng nước ép "Green Juice Hub".
            Nhiệm vụ: dựa vào nhu cầu/triệu chứng người dùng mô tả, gợi ý sản phẩm
            PHÙ HỢP NHẤT từ danh sách sản phẩm được cung cấp bên dưới.

            QUY TẮC BẮT BUỘC:
            1. CHỈ được gợi ý sản phẩm có trong danh sách "DANH SÁCH SẢN PHẨM" được cung cấp.
               TUYỆT ĐỐI không được bịa ra sản phẩm không có trong danh sách.
            2. Nếu không có sản phẩm nào phù hợp, hãy trung thực nói rằng hiện chưa có
               sản phẩm phù hợp, và có thể gợi ý sản phẩm gần đúng nhất kèm giải thích rõ.
            3. Gợi ý tối đa 3 sản phẩm, sắp xếp theo mức độ phù hợp giảm dần.
            4. KHÔNG đưa ra chẩn đoán y khoa, KHÔNG khẳng định sản phẩm "chữa bệnh".
               Chỉ dùng ngôn ngữ hỗ trợ như "có thể giúp", "hỗ trợ", "phù hợp với".
            5. Nếu người dùng mô tả triệu chứng nghiêm trọng (đau ngực dữ dội, khó thở,
               chảy máu, có ý định tự hại...), KHÔNG gợi ý sản phẩm, thay vào đó khuyên
               họ gặp bác sĩ/chuyên gia y tế ngay, và để trường "suggestedProducts" rỗng.
            6. Tôn trọng nguyên liệu cần tránh (dị ứng) nếu người dùng cung cấp — không
               được gợi ý sản phẩm chứa nguyên liệu đó.
            7. Giọng văn: thân thiện, ngắn gọn, tự nhiên như nhân viên tư vấn thực sự,
               không dùng ngôn ngữ quảng cáo sáo rỗng.
            8. Trả lời BẰNG TIẾNG VIỆT.

            ĐỊNH DẠNG BẮT BUỘC:
            Chỉ trả về JSON thuần túy, không có markdown, không có ```json, không có
            giải thích thêm bên ngoài JSON. Đúng theo schema:
            {
              "advice": "câu tư vấn ngắn gọn thân thiện",
              "suggestedProducts": [
                { "productId": <số nguyên>, "reason": "lý do ngắn gọn vì sao hợp" }
              ]
            }
            """;

    /**
     * Ghép toàn bộ prompt: rule + dữ liệu sản phẩm thật (RAG) + input người dùng.
     */
    public String buildPrompt(RecommendationRequest request, List<Product> availableProducts) {
        StringBuilder sb = new StringBuilder();
        sb.append(SYSTEM_RULES).append("\n\n");

        sb.append("=== DANH SÁCH SẢN PHẨM (chỉ được chọn trong đây) ===\n");
        if (availableProducts.isEmpty()) {
            sb.append("(Hiện không có sản phẩm nào khả dụng)\n");
        } else {
            for (Product p : availableProducts) {
                sb.append("- id: ").append(p.getId())
                        .append(" | tên: ").append(p.getName())
                        .append(" | mô tả: ").append(safe(p.getDescription()))
                        .append("\n");
            }
        }

        sb.append("\n=== YÊU CẦU CỦA NGƯỜI DÙNG ===\n");
        if (request.getMessage() != null && !request.getMessage().isBlank()) {
            sb.append("Mô tả tự do: ").append(request.getMessage()).append("\n");
        }
        if (request.getGoals() != null && !request.getGoals().isEmpty()) {
            sb.append("Mục tiêu sức khỏe: ").append(String.join(", ", request.getGoals())).append("\n");
        }
        if (request.getPreferences() != null && !request.getPreferences().isEmpty()) {
            sb.append("Sở thích khẩu vị: ").append(String.join(", ", request.getPreferences())).append("\n");
        }
        if (request.getAvoidIngredients() != null && !request.getAvoidIngredients().isEmpty()) {
            sb.append("Cần tránh (dị ứng): ").append(String.join(", ", request.getAvoidIngredients())).append("\n");
        }
        if (request.getMaxBudget() != null) {
            sb.append("Ngân sách tối đa: ").append(request.getMaxBudget()).append(" VNĐ\n");
        }

        return sb.toString();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}