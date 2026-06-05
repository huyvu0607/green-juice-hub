import { create } from 'zustand'
import authApi from '../api/authApi'
import userApi from '../api/userApi'
import useCartStore from './useCartStore' // ← thêm dòng này


const useAuthStore = create((set) => ({
  user: localStorage.getItem('role') ? { role: localStorage.getItem('role') } : null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoggedIn: !!localStorage.getItem('accessToken'),

  setAuth: async (accessToken, refreshToken, role) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('role', role)
    set({ accessToken, refreshToken, user: { role }, isLoggedIn: true })

    // Fetch thông tin user ngay sau khi login
    try {
      const res = await userApi.getMe()
      set({ user: res.data })
    } catch {
      // giữ nguyên { role } nếu lỗi
    }
  },


  setUser: (user) => set({ user }),

  fetchMe: async () => {
    try {
      const res = await userApi.getMe()
      set({ user: res.data })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('role')
      set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false })
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // BE lỗi vẫn logout FE bình thường
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('role')
      set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false })
      useCartStore.getState().resetCart()
    }
  },
}))

export default useAuthStore