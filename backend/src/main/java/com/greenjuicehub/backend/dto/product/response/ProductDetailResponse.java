package com.greenjuicehub.backend.dto.product.response;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Float avgRating;
    private Integer reviewCount;
    private CategoryResponse category;
    private List<String> images;
    private List<String> tags;
    private List<ProductVariantResponse> variants;
}