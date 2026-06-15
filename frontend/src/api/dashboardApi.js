import api from "./axiosConfig";

export const dashboardApi = {
    getSummary: () => api.get("/admin/dashboard/summary"),

    /**
     * @param {"7d" | "30d" | "12m"} range
     */
    getRevenueChart: (range = "7d") =>
        api.get("/admin/dashboard/revenue-chart", {
            params: { range },
        }),
};