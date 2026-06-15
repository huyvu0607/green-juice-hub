package com.greenjuicehub.backend.dto.adminProduct.response;

import com.greenjuicehub.backend.dto.product.response.CategoryResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminProductDetailResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Float avgRating;
    private Integer reviewCount;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private CategoryResponse category;
    private List<AdminProductImageResponse> images;
    private List<String> tags;
    private List<AdminVariantResponse> variants;
}