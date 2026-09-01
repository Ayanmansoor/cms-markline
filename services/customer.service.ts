import apiClient from '@/lib/api/client'

export const customerService = {
  getCustomers: async () => {
    const res = await apiClient.get('/api/customers')
    return res.data
  },

  getCustomerById: async (id: string | number) => {
    const res = await apiClient.get(`/api/customers/${id}`)
    return res.data
  },

  getWishlist: async () => {
    const res = await apiClient.get('/api/customers/wishlist')
    return res.data
  },

  getCarts: async () => {
    const res = await apiClient.get('/api/customers/carts')
    return res.data
  },

  getReviews: async () => {
    const res = await apiClient.get('/api/customers/reviews')
    return res.data
  },

  getAddresses: async () => {
    const res = await apiClient.get('/api/customers/addresses')
    return res.data
  },
}
