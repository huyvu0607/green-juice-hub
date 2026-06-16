package com.greenjuicehub.backend.dto.product.response;

public record TagDefinitionResponse(
        Long id,
        String key,
        String label
) {}