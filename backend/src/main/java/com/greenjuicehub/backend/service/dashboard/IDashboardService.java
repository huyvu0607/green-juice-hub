package com.greenjuicehub.backend.service.dashboard;

import com.greenjuicehub.backend.dto.dashboard.response.DashboardSummaryResponse;
import com.greenjuicehub.backend.dto.dashboard.response.RevenuePointResponse;

import java.util.List;

public interface IDashboardService {

    DashboardSummaryResponse getSummary();

    /**
     * @param range "7d" | "30d" | "12m" — mặc định "7d" nếu giá trị khác
     */
    List<RevenuePointResponse> getRevenueChart(String range);
}