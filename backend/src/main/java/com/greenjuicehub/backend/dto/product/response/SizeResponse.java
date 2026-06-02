package com.greenjuicehub.backend.dto.product.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SizeResponse {
    private Long id;
    private String name;
}