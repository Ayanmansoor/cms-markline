import apiClient from '@/lib/api/client'

export const categoryService = {
  getCollections: async () => {
    const res = await apiClient.get('/api/category/collection')
    return res.data
  },

  getCollectionById: async (id: string | number) => {
    const res = await apiClient.get(`/api/category/collection/${id}`)
    return res.data
  },

  createCollection: async (payload: any) => {
    const res = await apiClient.post('/api/category/collection', payload)
    return res.data
  },

  updateCollection: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/category/collection/${id}`, payload)
    return res.data
  },

  updateCollectionStatus: async (id: string | number, is_show: boolean) => {
    const res = await apiClient.put(`/api/category/collection/${id}`, { is_show })
    return res.data
  },

  deleteCollection: async (id: string | number) => {
    const res = await apiClient.delete(`/api/category/collection/${id}`)
    return res.data
  },

  getCollectionFilters: async () => {
    const res = await apiClient.get('/api/category/collection/filter')
    return res.data
  },

  getBanners: async () => {
    const res = await apiClient.get('/api/category/banner')
    return res.data
  },

  createBanner: async (payload: any) => {
    const res = await apiClient.post('/api/category/banner', payload)
    return res.data
  },

  updateBanner: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/category/banner/${id}`, payload)
    return res.data
  },

  deleteBanner: async (id: string | number) => {
    const res = await apiClient.delete(`/api/category/banner/${id}`)
    return res.data
  },
}
