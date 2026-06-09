package com.greenjuicehub.backend.dto.order.request;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class GetAvailablePromosRequest {

    // Cart checkout: truyền cartItemIds, để null nếu buyNow
    private List<Long> cartItemIds;

    // Buy now: truyền variantId + quantity, để null nếu cart
    private Long variantId;
    private Integer quantity;
}