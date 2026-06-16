package com.greenjuicehub.backend.dto.product.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FlavorResponse {
    private Long id;
    private String name;
    private Boolean isActive;
}