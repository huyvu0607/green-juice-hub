import api from './axiosConfig'

const cartApi = {
  getCart: () => api.get('/cart'),

  addItem: (productId, variantId, quantity = 1) =>
    api.post('/cart/items', { productId, variantId, quantity }),

  updateItem: (cartItemId, quantity) =>
    api.put(`/cart/items/${cartItemId}`, { quantity }),

  removeItem: (cartItemId) =>
    api.delete(`/cart/items/${cartItemId}`),

  clearCart: () =>
    api.delete('/cart'),
}

export default cartApi