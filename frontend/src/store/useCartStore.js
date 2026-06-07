import { create } from 'zustand'
import cartApi from '../api/cartApi'

const useCartStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────
  isOpen: false,
  items: [],
  totalItems: 0,
  totalQuantity: 0,
  totalAmount: 0,
  cartId: null,
  loading: false,
  error: null,

  // ── Sidebar toggle ───────────────────────────────────────
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

  // ── Fetch ────────────────────────────────────────────────
  fetchCart: async () => {
    set({ loading: true, error: null })
    try {
      const res = await cartApi.getCart()
      const { cartId, items, totalItems, totalQuantity, totalAmount } = res.data
      set({ cartId, items, totalItems, totalQuantity, totalAmount })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Không thể tải giỏ hàng' })
    } finally {
      set({ loading: false })
    }
  },

  // ── Add ──────────────────────────────────────────────────
  addItem: async (productId, variantId, quantity = 1) => {
    set({ loading: true, error: null })
    try {
      const res = await cartApi.addItem(productId, variantId, quantity)
      const { cartId, items, totalItems, totalQuantity, totalAmount } = res.data
      set({ cartId, items, totalItems, totalQuantity, totalAmount })
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thêm vào giỏ'
      set({ error: msg })
      throw new Error(msg)
    } finally {
      set({ loading: false })
    }
  },

  // ── Update qty ───────────────────────────────────────────
  updateItem: async (cartItemId, quantity) => {
    // Optimistic update
    const prev = get().items
    set((s) => ({
      items: s.items.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i
      ),
    }))
    try {
      const res = await cartApi.updateItem(cartItemId, quantity)
      const { items, totalItems, totalQuantity, totalAmount } = res.data
      set({ items, totalItems, totalQuantity, totalAmount })
    } catch (err) {
      set({ items: prev, error: err.response?.data?.message || 'Không thể cập nhật' })
    }
  },

  // ── Remove ───────────────────────────────────────────────
  removeItem: async (cartItemId) => {
    const prev = get().items
    set((s) => ({
      items: s.items.filter((i) => i.cartItemId !== cartItemId),
    }))
    try {
      const res = await cartApi.removeItem(cartItemId)
      const { items, totalItems, totalQuantity, totalAmount } = res.data
      set({ items, totalItems, totalQuantity, totalAmount })
    } catch (err) {
      set({ items: prev, error: err.response?.data?.message || 'Không thể xoá' })
    }
  },

  // ── Clear ────────────────────────────────────────────────
  clearCart: async () => {
    try {
      await cartApi.clearCart()
      set({ items: [], totalItems: 0, totalQuantity: 0, totalAmount: 0 })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Không thể xoá giỏ hàng' })
    }
  },

  // ── Reset local (khi logout) ─────────────────────────────
  resetCart: () =>
    set({ items: [], totalItems: 0, totalQuantity: 0, totalAmount: 0, cartId: null, isOpen: false }),
}))

export default useCartStore