import axiosInstance from "./axiosConfig";

const adminPolicyApi = {
    /** Lấy tất cả chính sách (kể cả inactive) */
    getAll: () =>
        axiosInstance.get("/admin/policies"),

    /** Lấy chi tiết theo id */
    getById: (id) =>
        axiosInstance.get(`/admin/policies/${id}`),

    /** Tạo chính sách mới */
    create: (data) =>
        axiosInstance.post("/admin/policies", data),

    /** Cập nhật chính sách */
    update: (id, data) =>
        axiosInstance.put(`/admin/policies/${id}`, data),

    /** Bật / tắt trạng thái hiển thị */
    toggleActive: (id) =>
        axiosInstance.patch(`/admin/policies/${id}/toggle-active`),
};

export default adminPolicyApi;