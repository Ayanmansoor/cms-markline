import apiClient from '@/lib/api/client'

export const discountService = {
  getDiscounts: async () => {
    const res = await apiClient.get('/api/discounts')
    return res.data
  },

  getDiscountById: async (id: string | number) => {
    const res = await apiClient.get(`/api/discounts/${id}`)
    return res.data
  },

  createDiscount: async (payload: any) => {
    const res = await apiClient.post('/api/discounts', payload)
    return res.data
  },

  updateDiscount: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/discounts/${id}`, payload)
    return res.data
  },

  deleteDiscount: async (id: string | number) => {
    const res = await apiClient.delete(`/api/discounts/${id}`)
    return res.data
  },

  getCoupons: async () => {
    const res = await apiClient.get('/api/coupon')
    return res.data
  },

  getCouponById: async (id: string | number) => {
    const res = await apiClient.get(`/api/coupon/${id}`)
    return res.data
  },

  createCoupon: async (payload: any) => {
    const res = await apiClient.post('/api/coupon', payload)
    return res.data
  },

  updateCoupon: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/coupon/${id}`, payload)
    return res.data
  },

  deleteCoupon: async (id: string | number) => {
    const res = await apiClient.delete(`/api/coupon/${id}`)
    return res.data
  },
}
