import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardApi } from "@/api/dashboardApi";

// ==================== ICONS (outline SVG, 24x24) ====================
const icons = {
    revenue: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v10M9.5 9.5h3.5a1.5 1.5 0 0 1 0 3H10a1.5 1.5 0 0 0 0 3h4" />
        </svg>
    ),
    trending: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
        </svg>
    ),
    calendar: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    ),
    cart: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="20" r="1.2" />
            <circle cx="18" cy="20" r="1.2" />
            <path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6.2" />
        </svg>
    ),
    box: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8.5l-9-4.5-9 4.5 9 4.5 9-4.5Z" />
            <path d="M3 8.5v8l9 4.5 9-4.5v-8" />
            <path d="M12 13v8" />
        </svg>
    ),
    star: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17l-5.5 3 1-6.5L3 9l6-1 3-6Z" />
        </svg>
    ),
};

const RANGES = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "12m", label: "12 tháng" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">
            <span className="h-5 w-5">{icon}</span>
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const { revenue, orderCount } = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-green-600">{formatCurrency(revenue)}</p>
      <p className="text-gray-500">{orderCount} đơn</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState("7d");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoadingSummary(true);
    dashboardApi
      .getSummary()
      .then((res) => {
        if (mounted) setSummary(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoadingSummary(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingChart(true);
    dashboardApi
      .getRevenueChart(range)
      .then((res) => {
        if (mounted) setChartData(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoadingChart(false);
      });
    return () => {
      mounted = false;
    };
  }, [range]);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Không thể tải dữ liệu dashboard. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Tổng quan</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Doanh thu hôm nay"
          value={loadingSummary ? "..." : formatCurrency(summary?.revenueToday)}
          icon={icons.revenue}
        />
        <MetricCard
          label="Doanh thu tuần này"
          value={loadingSummary ? "..." : formatCurrency(summary?.revenueThisWeek)}
          icon={icons.trending}
        />
        <MetricCard
          label="Doanh thu tháng này"
          value={loadingSummary ? "..." : formatCurrency(summary?.revenueThisMonth)}
          icon={icons.calendar}
        />
        <MetricCard
          label="Đơn hàng mới"
          value={loadingSummary ? "..." : summary?.newOrdersCount ?? 0}
          icon={icons.cart}
        />
        <MetricCard
          label="Sản phẩm sắp hết hàng"
          value={loadingSummary ? "..." : summary?.lowStockVariantsCount ?? 0}
          icon={icons.box}
        />
        <MetricCard
          label="Đánh giá chờ duyệt"
          value={loadingSummary ? "..." : summary?.pendingReviewsCount ?? 0}
          icon={icons.star}
        />
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Doanh thu theo thời gian</h2>
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`rounded-lg px-3 py-1 text-sm transition ${
                  range === r.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: "100%", height: 300 }}>
          {loadingChart ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              Đang tải...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(value)
                  }
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}