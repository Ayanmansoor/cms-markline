import apiClient from '@/lib/api/client'

export const settingsService = {
  getShiprocketSettings: async () => {
    const res = await apiClient.get('/api/settings/shiprocket')
    return res.data
  },

  saveShiprocketSettings: async (payload: any) => {
    const res = await apiClient.post('/api/settings/shiprocket', payload)
    return res.data
  },

  getWarehouses: async () => {
    const res = await apiClient.get('/api/settings/warehouses')
    return res.data
  },

  getProductGroups: async () => {
    const res = await apiClient.get('/api/settings/product-groups')
    return res.data
  },

  getNewsletters: async () => {
    const res = await apiClient.get('/api/settings/newsletter')
    return res.data
  },

  getHeaderAlerts: async () => {
    const res = await apiClient.get('/api/settings/header-alerts')
    return res.data
  },
}
