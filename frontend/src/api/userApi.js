// frontend/src/api/userApi.js
import api from './axiosConfig'

const userApi = {
  // Profile
  getMe:          ()              => api.get('/users/me'),
  updateProfile:  (data)          => api.put('/users/me', data),
  changePassword: (data)          => api.put('/users/me/password', data),

  // Addresses
  getAddresses:   ()              => api.get('/users/me/addresses'),
  createAddress:  (data)          => api.post('/users/me/addresses', data),
  updateAddress:  (id, data)      => api.put(`/users/me/addresses/${id}`, data),
  deleteAddress:  (id)            => api.delete(`/users/me/addresses/${id}`),
  setDefault:     (id)            => api.patch(`/users/me/addresses/${id}/default`),
}

export default userApi