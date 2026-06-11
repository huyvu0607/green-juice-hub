package com.greenjuicehub.backend.dto.order.request;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ShippingFeeRequest {
    private Long addressId;

    // Cart flow
    private List<Long> cartItemIds;

    // BuyNow flow
    private Long variantId;
    private Integer quantity;
}