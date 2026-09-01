import apiClient from '@/lib/api/client'

export const productService = {
  getProducts: async () => {
    const res = await apiClient.get('/api/products')
    return res.data
  },

  getProductById: async (id: string | number) => {
    const res = await apiClient.get(`/api/products/${id}`)
    return res.data
  },

  createProduct: async (payload: any) => {
    const res = await apiClient.post('/api/products', payload)
    return res.data
  },

  updateProduct: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/products/${id}`, payload)
    return res.data
  },

  deleteProduct: async (id: string | number) => {
    const res = await apiClient.delete(`/api/products/${id}`)
    return res.data
  },
}
