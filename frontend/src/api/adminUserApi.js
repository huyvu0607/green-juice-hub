import api from './axiosConfig'

const adminUserApi = {
  /**
   * Danh sách user với filter + phân trang
   * @param {Object} params - { keyword, role, isActive, page, size }
   */
  getUsers: (params = {}) =>
    api.get('/admin/users', { params }),

  /**
   * Khoá / mở khoá tài khoản
   * @param {number} userId
   */
  toggleActive: (userId) =>
    api.patch(`/admin/users/${userId}/toggle-active`),

  /**
   * Gán role mới
   * @param {number} userId
   * @param {string} role - 'CUSTOMER' | 'STAFF' | 'ADMIN'
   */
  updateRole: (userId, role) =>
    api.patch(`/admin/users/${userId}/role`, { role }),

  /**
   * Tạo mã khuyến mãi cá nhân cho user
   * @param {number} userId
   * @param {Object} data - CreatePersonalPromoRequest
   */
  createPersonalPromo: (userId, data) =>
    api.post(`/admin/users/${userId}/personal-promos`, data),
}

export default adminUserApi