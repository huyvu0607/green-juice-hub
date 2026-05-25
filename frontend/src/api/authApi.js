import api from './axiosConfig'

const authApi = {
  sendOtp: (phone, type) =>
    api.post('/auth/send-otp', { phone, type }),

  verifyOtp: (phone, otpCode, type) =>
    api.post('/auth/verify-otp', { phone, otpCode, type }),

  loginWithOtp: (tempToken) =>
    api.post('/auth/login-with-otp', { tempToken }),

  login: (identifier, password, captchaToken) =>
    api.post('/auth/login', { identifier, password, captchaToken }),

  setPassword: (tempToken, password) =>
    api.post('/auth/set-password', { tempToken, password }),

  resetPassword: (tempToken, newPassword) =>
    api.post('/auth/reset-password', { tempToken, newPassword }),

  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),

  loginWithGoogle: (idToken) =>
    api.post('/auth/google', { idToken }),

  refresh: () =>
    api.post('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),
}

export default authApi