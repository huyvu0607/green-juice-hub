package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.dashboard.response.DashboardSummaryResponse;
import com.greenjuicehub.backend.dto.dashboard.response.RevenuePointResponse;
import com.greenjuicehub.backend.service.dashboard.IDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class DashboardController {

    private final IDashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    /**
     * @param range "7d" | "30d" | "12m" (mặc định "7d")
     */
    @GetMapping("/revenue-chart")
    public ResponseEntity<List<RevenuePointResponse>> getRevenueChart(
            @RequestParam(defaultValue = "7d") String range) {
        return ResponseEntity.ok(dashboardService.getRevenueChart(range));
    }
}