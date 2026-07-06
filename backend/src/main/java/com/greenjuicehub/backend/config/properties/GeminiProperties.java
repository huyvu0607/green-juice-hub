package com.greenjuicehub.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

/**
 * Cấu hình cho Google Gemini API.
 * Các giá trị được đọc từ application.yml, và application.yml đọc từ biến môi trường
 * (xem hướng dẫn set biến môi trường trên Railway ở cuối phần trao đổi).
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "gemini")
public class GeminiProperties {

    /**
     * API key lấy từ Google AI Studio (https://aistudio.google.com/apikey)
     */
    private String apiKey;

    /**
     * Model dùng để gợi ý sản phẩm. Mặc định dùng bản flash vì nhanh và rẻ,
     * phù hợp cho tác vụ gợi ý (không cần model nặng như pro).
     */
    private String model = "gemini-2.5-flash";

    /**
     * Base URL của Gemini API (generativelanguage.googleapis.com)
     */
    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    /**
     * Timeout gọi API (ms)
     */
    private int timeoutMs = 15000;

    /**
     * Nhiệt độ sinh (0.0 - 1.0). Thấp hơn = ổn định, ít "sáng tạo" hơn.
     * Với gợi ý sản phẩm nên để thấp để tránh AI bịa sản phẩm không có thật.
     */
    private double temperature = 0.4;
}