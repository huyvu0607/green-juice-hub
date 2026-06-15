package com.greenjuicehub.backend.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class DashboardSummaryResponse {

    // Doanh thu (chỉ tính order có payment_status = PAID)
    private BigDecimal revenueToday;
    private BigDecimal revenueThisWeek;
    private BigDecimal revenueThisMonth;

    // Số đơn hàng mới (status = PENDING)
    private Long newOrdersCount;

    // Sản phẩm sắp hết hàng (variant active có stock_qty <= 10)
    private Long lowStockVariantsCount;

    // Đánh giá chờ duyệt (is_approved = false)
    private Long pendingReviewsCount;
}