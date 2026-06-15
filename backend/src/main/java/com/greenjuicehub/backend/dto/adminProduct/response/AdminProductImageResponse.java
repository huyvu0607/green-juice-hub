package com.greenjuicehub.backend.dto.adminProduct.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminProductImageResponse {
    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
    private Integer sortOrder;
}