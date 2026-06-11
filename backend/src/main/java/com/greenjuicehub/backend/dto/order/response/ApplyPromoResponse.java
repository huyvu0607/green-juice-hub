package com.greenjuicehub.backend.dto.order.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyPromoResponse {

    private String promoCode;
    private String promoName;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAfterDiscount;
    private String message;
    private String promoType;
    private Boolean freeShipping;
}