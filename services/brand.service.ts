import apiClient from '@/lib/api/client'

export const brandService = {
  getBrands: async () => {
    const res = await apiClient.get('/api/brands')
    return res.data
  },

  getBrandById: async (id: string | number) => {
    const res = await apiClient.get(`/api/brands/${id}`)
    return res.data
  },

  createBrand: async (payload: any) => {
    const res = await apiClient.post('/api/brands', payload)
    return res.data
  },

  updateBrand: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/brands/${id}`, payload)
    return res.data
  },

  deleteBrand: async (id: string | number) => {
    const res = await apiClient.delete(`/api/brands/${id}`)
    return res.data
  },
}
