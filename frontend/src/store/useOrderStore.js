import { create } from 'zustand'
import orderApi from '../api/orderApi'

const useOrderStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────
  orders: [],
  currentOrder: null,   // đơn vừa đặt hoặc đang xem chi tiết
  totalPages: 0,
  currentPage: 0,
  loading: false,
  placing: false,       // riêng cho nút "Đặt hàng" để tránh double-submit
  error: null,
  statusCounts: {},
  activeStatus: null,

  // promo preview
  promoResult: null,    // { promoCode, promoName, discountAmount, totalAfterDiscount, ... }
  promoLoading: false,
  promoError: null,

  // ── Actions ─────────────────────────────────────────────
  fetchStatusCounts: async () => {
    try {
      const res = await orderApi.getStatusCounts()
      set({ statusCounts: res.data })
    } catch { }
  },

  // Lấy danh sách mã khuyến mãi có thể áp dụng cho giỏ hàng hiện tại
  fetchAvailablePromos: async (payload) => {
    const res = await orderApi.getAvailablePromos(payload)
    return res.data  // trả về array, PromoPickerModal tự set vào state
  },

  // ── Fetch danh sách ──────────────────────────────────────
  fetchMyOrders: async (page = 0, size = 10, status = null) => {
    set({ loading: true, error: null })
    try {
      const res = await orderApi.getMyOrders(page, size, status)
      const { content, totalPages, number } = res.data
      set((s) => ({
        orders: page === 0 ? content : [...s.orders, ...content],
        totalPages,
        currentPage: number,
        activeStatus: status,
      }))
    } catch (err) {
      set({ error: err.response?.data?.message || 'Không thể tải đơn hàng' })
    } finally {
      set({ loading: false })
    }
  },

  // ── Fetch chi tiết ───────────────────────────────────────
  fetchOrderDetail: async (orderId) => {
    set({ loading: true, error: null, currentOrder: null })
    try {
      const res = await orderApi.getOrderDetail(orderId)
      set({ currentOrder: res.data })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Không tìm thấy đơn hàng' })
    } finally {
      set({ loading: false })
    }
  },

  // ── Đặt hàng ────────────────────────────────────────────
  placeOrder: async (payload) => {
    set({ placing: true, error: null })
    try {
      const res = await orderApi.placeOrder(payload)
      set({ currentOrder: res.data })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Đặt hàng thất bại, thử lại sau'
      set({ error: msg })
      throw new Error(msg)
    } finally {
      set({ placing: false })
    }
  },

  // ── Mua ngay ─────────────────────────────────────────────────
  buyNow: async (payload) => {
    set({ placing: true, error: null })
    try {
      const res = await orderApi.buyNow(payload)
      set({ currentOrder: res.data })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Đặt hàng thất bại, thử lại sau'
      set({ error: msg })
      throw new Error(msg)
    } finally {
      set({ placing: false })
    }
  },

  // ── Huỷ đơn ─────────────────────────────────────────────
  cancelOrder: async (orderId, reason) => {
    set({ loading: true, error: null })
    try {
      const res = await orderApi.cancelOrder(orderId, reason)
      set((s) => ({
        orders: s.orders.map((o) => o.id === orderId ? res.data : o),
        currentOrder: s.currentOrder?.id === orderId ? res.data : s.currentOrder,
      }))
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Huỷ đơn thất bại'
      set({ error: msg })
      throw new Error(msg)
    } finally {
      set({ loading: false })
    }
  },

  // ── Áp mã khuyến mãi ────────────────────────────────────
  applyPromo: async (promoCode, promoPayload) => {
    set({ promoLoading: true, promoError: null, promoResult: null })
    try {
      const res = await orderApi.applyPromo(promoCode, promoPayload)
      set({ promoResult: res.data })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Mã không hợp lệ'
      set({ promoError: msg })
      throw new Error(msg)
    } finally {
      set({ promoLoading: false })
    }
  },

  clearPromo: () => set({ promoResult: null, promoError: null }),
  clearError: () => set({ error: null }),
  clearCurrentOrder: () => set({ currentOrder: null }),
}))

export default useOrderStore