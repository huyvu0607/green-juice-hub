import api from './axiosConfig'

const adminBannerApi = {
  /**
   * Lấy tất cả banner (có cả inactive)
   */
  getAll: () =>
    api.get('/admin/banners'),

  /**
   * Tạo banner mới
   * @param {Object} data - SaveBannerRequest
   */
  create: (data) =>
    api.post('/admin/banners', data),

  /**
   * Cập nhật banner
   * @param {number} id
   * @param {Object} data - SaveBannerRequest
   */
  update: (id, data) =>
    api.put(`/admin/banners/${id}`, data),

  /**
   * Xoá banner
   * @param {number} id
   */
  remove: (id) =>
    api.delete(`/admin/banners/${id}`),

  /**
   * Toggle active / inactive
   * @param {number} id
   */
  toggleActive: (id) =>
    api.patch(`/admin/banners/${id}/toggle-active`),
}

export default adminBannerApi