package com.greenjuicehub.backend.dto.adminOrder.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponse {
    private Long   productId;
    private String name;
    private Long   totalSold;
}