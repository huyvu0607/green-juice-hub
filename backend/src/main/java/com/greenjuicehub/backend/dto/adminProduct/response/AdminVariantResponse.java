package com.greenjuicehub.backend.dto.adminProduct.response;

import com.greenjuicehub.backend.dto.product.response.FlavorResponse;
import com.greenjuicehub.backend.dto.product.response.SizeResponse;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class AdminVariantResponse {
    private Long id;
    private FlavorResponse flavor;
    private SizeResponse size;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private BigDecimal discountPercent;
    private Integer stockQty;
    private Integer weightGram;
    private Integer sortOrder;
    private Boolean isActive;
}