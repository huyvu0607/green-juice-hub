package com.greenjuicehub.backend.dto.order.response;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AvailablePromoResponse {
    private String code;
    private String name;
    private String discountType;      // "PERCENT" | "FIXED"
    private BigDecimal discountValue;
    private BigDecimal minOrderValue;
    private Boolean isEligible;
    private String reason;            // null nếu eligible, có message nếu không
}