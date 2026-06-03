import api from './axiosConfig'

const userApi = {
  getMe: () => api.get('/users/me'),
}

export default userApi