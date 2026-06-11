package com.greenjuicehub.backend.dto.order.response;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingFeeResponse {
    private BigDecimal shippingFee;
}