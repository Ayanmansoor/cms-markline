import apiClient from '@/lib/api/client'

export const bannerService = {
  getBanners: async () => {
    const res = await apiClient.get('/api/banners')
    return res.data
  },

  getBannerById: async (id: string | number) => {
    const res = await apiClient.get(`/api/banners/${id}`)
    return res.data
  },

  createBanner: async (payload: any) => {
    const res = await apiClient.post('/api/banners', payload)
    return res.data
  },

  updateBanner: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/banners/${id}`, payload)
    return res.data
  },

  deleteBanner: async (id: string | number) => {
    const res = await apiClient.delete(`/api/banners/${id}`)
    return res.data
  },

  getVideoBanners: async () => {
    const res = await apiClient.get('/api/banners/video')
    return res.data
  },

  createVideoBanner: async (payload: any) => {
    const res = await apiClient.post('/api/banners/video', payload)
    return res.data
  },

  updateVideoBanner: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/banners/video/${id}`, payload)
    return res.data
  },

  deleteVideoBanner: async (id: string | number) => {
    const res = await apiClient.delete(`/api/banners/video/${id}`)
    return res.data
  },
}
