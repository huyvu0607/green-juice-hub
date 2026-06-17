import api from './axiosConfig'

const adminReviewApi = {
  /**
   * GET /api/admin/reviews?isApproved=&rating=&page=&size=
   * @param {Object} params - { isApproved: boolean|undefined, rating: number|undefined, page, size }
   */
  getReviews: (params = {}) =>
    api.get('/admin/reviews', { params }),

  /**
   * PATCH /api/admin/reviews/{id}/toggle
   * Bật/tắt hiển thị review — cập nhật isApproved
   */
  toggle: (id) =>
    api.patch(`/admin/reviews/${id}/toggle`),

  /**
   * DELETE /api/admin/reviews/{id}
   * Xoá hẳn khỏi DB
   */
  delete: (id) =>
    api.delete(`/admin/reviews/${id}`),

  /**
   * POST /api/admin/reviews/{id}/reply
   * Phản hồi từ Admin/Staff — gửi reply = '' để xoá phản hồi
   * @param {number} id
   * @param {string} reply
   */
  reply: (id, reply) =>
    api.post(`/admin/reviews/${id}/reply`, { reply }),
}

export default adminReviewApi