import api from "./axiosConfig";

const adminPromotionApi = {
  // ── Promotions ────────────────────────────────────────────────────────────
  getPromotions: (params) => api.get("/admin/promotions", { params }),
  getPromotion: (id) => api.get(`/admin/promotions/${id}`),
  createPromotion: (data) => api.post("/admin/promotions", data),
  updatePromotion: (id, data) => api.put(`/admin/promotions/${id}`, data),
  toggleActive: (id) => api.patch(`/admin/promotions/${id}/toggle-active`),

  // ── Usage history ─────────────────────────────────────────────────────────
  getUsageHistory: (id, params) => api.get(`/admin/promotions/${id}/usages`, { params }),
};

export default adminPromotionApi;