package com.greenjuicehub.backend.service.recommendation.impl;

import java.util.List;
import java.util.Map;

import com.greenjuicehub.backend.entity.ProductImage;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenjuicehub.backend.config.properties.GeminiProperties;
import com.greenjuicehub.backend.dto.recommendation.request.RecommendationRequest;
import com.greenjuicehub.backend.dto.recommendation.response.RecommendationResponse;
import com.greenjuicehub.backend.entity.Product;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.ProductRepository;
import com.greenjuicehub.backend.service.recommendation.IRecommendationService;
import com.greenjuicehub.backend.service.recommendation.prompt.RecommendationPromptBuilder;

@Service
public class GeminiRecommendationServiceImpl implements IRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(GeminiRecommendationServiceImpl.class);

    private final GeminiProperties geminiProperties;
    private final RecommendationPromptBuilder promptBuilder;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public GeminiRecommendationServiceImpl(
            GeminiProperties geminiProperties,
            RecommendationPromptBuilder promptBuilder,
            ProductRepository productRepository,
            ObjectMapper objectMapper) {
        this.geminiProperties = geminiProperties;
        this.promptBuilder = promptBuilder;
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(geminiProperties.getBaseUrl())
                .build();
    }

    @Override
    @Transactional
    public RecommendationResponse recommend(RecommendationRequest request) {
        // 1. Lấy danh sách sản phẩm thật đang active (RAG context)
        //    LƯU Ý: điều chỉnh lại tên method này cho khớp với ProductRepository
        //    thật của bạn, ví dụ findByActiveTrue() hoặc findAllAvailable().
        List<Product> availableProducts = productRepository.findByIsDeletedFalseAndIsActiveTrue();

        // 2. Ghép prompt: rule + data sản phẩm + input người dùng
        String userPrompt = promptBuilder.buildPrompt(request, availableProducts);

        // 3. Gọi Gemini API
        String rawJson = callGemini(userPrompt);

        // 4. Parse JSON trả về thành RecommendationResponse
        return parseResponse(rawJson);
    }

    private String callGemini(String promptText) {
        String url = "/models/%s:generateContent?key=%s".formatted(
                geminiProperties.getModel(), geminiProperties.getApiKey());

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", promptText)))
                ),
                "generationConfig", Map.of(
                        "temperature", geminiProperties.getTemperature(),
                        "responseMimeType", "application/json"
                )
        );

        try {
            Map<?, ?> response = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            return extractTextFromGeminiResponse(response);

        } catch (RestClientResponseException e) {
            log.error("Gemini API lỗi: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AppException(HttpStatus.BAD_GATEWAY, "Không thể lấy gợi ý từ AI lúc này, vui lòng thử lại sau");
        } catch (Exception e) {
            log.error("Lỗi không xác định khi gọi Gemini API", e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra khi xử lý yêu cầu gợi ý");
        }
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromGeminiResponse(Map<?, ?> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.error("Không parse được response Gemini: {}", response);
            throw new AppException(HttpStatus.BAD_GATEWAY, "Phản hồi AI không hợp lệ");
        }
    }

    private RecommendationResponse parseResponse(String rawJson) {
        try {
            RecommendationResponse response = objectMapper.readValue(rawJson, RecommendationResponse.class);
            enrichSuggestedProducts(response);
            return response;
        } catch (Exception e) {
            log.error("Không parse được JSON từ AI: {}", rawJson, e);
            throw new AppException(HttpStatus.BAD_GATEWAY, "Không thể xử lý gợi ý từ AI, vui lòng thử lại");
        }
    }

    private void enrichSuggestedProducts(RecommendationResponse response) {
        if (response.getSuggestedProducts() == null) return;

        for (RecommendationResponse.SuggestedProduct sp : response.getSuggestedProducts()) {
            productRepository.findById(sp.getProductId()).ifPresent(product -> {
                sp.setName(product.getName());
                sp.setSlug(product.getSlug());
                sp.setImageUrl(findPrimaryImageUrl(product));
            });
        }
    }

    private String findPrimaryImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }
        return product.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(product.getImages().get(0).getImageUrl());
    }
}