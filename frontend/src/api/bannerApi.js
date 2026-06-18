import api from './axiosConfig'

const bannerApi = {
  /**
   * Lấy banner đang active (public — dùng ở homepage)
   */
  getActiveBanners: () =>
    api.get('/banners'),
}


export default bannerApi