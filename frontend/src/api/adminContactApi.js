import api from './axiosConfig'

const adminContactApi = {
  /** Danh sách liên hệ — lọc theo status, phân trang */
  getContacts: (params = {}, config = {}) =>
    api.get('/admin/contacts', { params, ...config }),

  /** Đếm số liên hệ theo từng status — dùng cho tab badge */
  getStats: () =>
    api.get('/admin/contacts/stats'),

  /** Cập nhật trạng thái liên hệ */
  updateStatus: (id, status) =>
    api.patch(`/admin/contacts/${id}/status`, null, { params: { status } }),

  /** Trả lời liên hệ — tự động gửi email cho khách */
  reply: (id, reply) =>
    api.post(`/admin/contacts/${id}/reply`, { reply }),
}

export default adminContactApi