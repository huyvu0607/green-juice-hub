package com.greenjuicehub.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.greenjuicehub.backend.dto.recommendation.request.RecommendationRequest;
import com.greenjuicehub.backend.dto.recommendation.response.RecommendationResponse;
import com.greenjuicehub.backend.service.recommendation.IRecommendationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/recommendation")
public class RecommendationController {

    private final IRecommendationService recommendationService;

    public RecommendationController(IRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    /**
     * Dùng chung cho cả 2 luồng:
     * - Chatbot tự do: FE chỉ gửi { "message": "..." }
     * - Form trắc nghiệm: FE gửi { "goals": [...], "preferences": [...], ... }
     * - Có thể kết hợp cả hai trong cùng 1 request.
     */
    @PostMapping
    public ResponseEntity<RecommendationResponse> recommend(
            @Valid @RequestBody RecommendationRequest request) {
        return ResponseEntity.ok(recommendationService.recommend(request));
    }
}