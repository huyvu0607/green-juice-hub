package com.greenjuicehub.backend.service.dashboard.impl;

import com.greenjuicehub.backend.dto.dashboard.response.DashboardSummaryResponse;
import com.greenjuicehub.backend.dto.dashboard.response.RevenuePointResponse;
import com.greenjuicehub.backend.entity.Order;
import com.greenjuicehub.backend.repository.OrderRepository;
import com.greenjuicehub.backend.repository.ProductVariantRepository;
import com.greenjuicehub.backend.repository.ReviewRepository;
import com.greenjuicehub.backend.service.dashboard.IDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements IDashboardService {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private static final DateTimeFormatter DAY_LABEL_FORMAT = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter MONTH_LABEL_FORMAT = DateTimeFormatter.ofPattern("MM/yyyy");

    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final ReviewRepository reviewRepository;

    // ==================== SUMMARY ====================
    @Override
    public DashboardSummaryResponse getSummary() {
        LocalDateTime now = LocalDateTime.now();

        // Hôm nay: 00:00 hôm nay -> 00:00 ngày mai
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);

        // Tuần này: thứ 2 đầu tuần -> 00:00 ngày mai
        LocalDateTime startOfWeek = now.toLocalDate()
                .with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                .atStartOfDay();

        // Tháng này: ngày 1 đầu tháng -> 00:00 ngày mai
        LocalDateTime startOfMonth = now.toLocalDate()
                .withDayOfMonth(1)
                .atStartOfDay();

        BigDecimal revenueToday = orderRepository.sumRevenueBetween(startOfToday, startOfTomorrow);
        BigDecimal revenueThisWeek = orderRepository.sumRevenueBetween(startOfWeek, startOfTomorrow);
        BigDecimal revenueThisMonth = orderRepository.sumRevenueBetween(startOfMonth, startOfTomorrow);

        long newOrdersCount = orderRepository.countByStatus(Order.OrderStatus.PENDING);
        long lowStockCount = variantRepository.countByIsActiveTrueAndStockQtyLessThanEqual(LOW_STOCK_THRESHOLD);
        long pendingReviewsCount = reviewRepository.countByIsApprovedFalse();

        return DashboardSummaryResponse.builder()
                .revenueToday(revenueToday)
                .revenueThisWeek(revenueThisWeek)
                .revenueThisMonth(revenueThisMonth)
                .newOrdersCount(newOrdersCount)
                .lowStockVariantsCount(lowStockCount)
                .pendingReviewsCount(pendingReviewsCount)
                .build();
    }

    // ==================== REVENUE CHART ====================
    @Override
    public List<RevenuePointResponse> getRevenueChart(String range) {
        return switch (range) {
            case "30d" -> buildDailyChart(30);
            case "12m" -> buildMonthlyChart(12);
            default -> buildDailyChart(7); // "7d" hoặc giá trị không hợp lệ
        };
    }

    // ==================== HELPER: Chart theo ngày ====================
    private List<RevenuePointResponse> buildDailyChart(int days) {
        LocalDate today = LocalDate.now();
        LocalDate fromDate = today.minusDays(days - 1L);

        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();

        List<Object[]> rows = orderRepository.sumRevenueGroupByDay(from, to);

        // Map ngày -> [revenue, orderCount]
        Map<LocalDate, Object[]> dataMap = new HashMap<>();
        for (Object[] row : rows) {
            LocalDate day = toLocalDate(row[0]);
            dataMap.put(day, new Object[]{row[1], row[2]});
        }

        List<RevenuePointResponse> result = new ArrayList<>();
        for (long i = 0; i < days; i++) {
            LocalDate date = fromDate.plusDays(i);
            Object[] data = dataMap.get(date);

            BigDecimal revenue = data != null ? toBigDecimal(data[0]) : BigDecimal.ZERO;
            long orderCount = data != null ? toLong(data[1]) : 0L;

            result.add(RevenuePointResponse.builder()
                    .label(date.format(DAY_LABEL_FORMAT))
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .build());
        }

        return result;
    }

    // ==================== HELPER: Chart theo tháng ====================
    private List<RevenuePointResponse> buildMonthlyChart(int months) {
        YearMonth currentMonth = YearMonth.now();
        YearMonth fromMonth = currentMonth.minusMonths(months - 1L);

        LocalDateTime from = fromMonth.atDay(1).atStartOfDay();
        LocalDateTime to = currentMonth.plusMonths(1).atDay(1).atStartOfDay();

        List<Object[]> rows = orderRepository.sumRevenueGroupByMonth(from, to);

        // Map YearMonth -> [revenue, orderCount]
        Map<YearMonth, Object[]> dataMap = new HashMap<>();
        for (Object[] row : rows) {
            int year = toInt(row[0]);
            int month = toInt(row[1]);
            YearMonth ym = YearMonth.of(year, month);
            dataMap.put(ym, new Object[]{row[2], row[3]});
        }

        List<RevenuePointResponse> result = new ArrayList<>();
        for (long i = 0; i < months; i++) {
            YearMonth ym = fromMonth.plusMonths(i);
            Object[] data = dataMap.get(ym);

            BigDecimal revenue = data != null ? toBigDecimal(data[0]) : BigDecimal.ZERO;
            long orderCount = data != null ? toLong(data[1]) : 0L;

            result.add(RevenuePointResponse.builder()
                    .label(ym.atDay(1).format(MONTH_LABEL_FORMAT))
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .build());
        }

        return result;
    }

    // ==================== CONVERSION HELPERS (native query trả Object[]) ====================
    private LocalDate toLocalDate(Object value) {
        if (value instanceof java.sql.Date d) return d.toLocalDate();
        if (value instanceof LocalDate ld) return ld;
        return LocalDate.parse(value.toString());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof BigDecimal bd) return bd;
        if (value == null) return BigDecimal.ZERO;
        return new BigDecimal(value.toString());
    }

    private long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        return Long.parseLong(value.toString());
    }

    private int toInt(Object value) {
        if (value instanceof Number n) return n.intValue();
        return Integer.parseInt(value.toString());
    }
}