package com.greenjuicehub.backend.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class RevenuePointResponse {

    /**
     * Label hiển thị trên biểu đồ.
     * - range = "7d" hoặc "30d" -> dạng "dd/MM" (theo ngày)
     * - range = "12m" -> dạng "MM/yyyy" (theo tháng)
     */
    private String label;

    private BigDecimal revenue;

    private Long orderCount;
}