import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoggedIn: !!localStorage.getItem('accessToken'),

  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ accessToken, refreshToken, user, isLoggedIn: true })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false })
  },
}))

export default useAuthStore