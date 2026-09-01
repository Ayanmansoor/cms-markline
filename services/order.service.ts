import apiClient from '@/lib/api/client'

export const orderService = {
  getOrders: async () => {
    const res = await apiClient.get('/api/orders')
    return res.data
  },

  getOrderById: async (id: string | number) => {
    const res = await apiClient.get(`/api/orders/${id}`)
    return res.data
  },

  createOrder: async (payload: any) => {
    const res = await apiClient.post('/api/orders', payload)
    return res.data
  },

  updateOrder: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/orders/${id}`, payload)
    return res.data
  },

  getShipments: async () => {
    const res = await apiClient.get('/api/shipments')
    return res.data
  },

  getShipmentById: async (id: string | number) => {
    const res = await apiClient.get(`/api/shipments/${id}`)
    return res.data
  },

  updateShipment: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/shipments/${id}`, payload)
    return res.data
  },
}
