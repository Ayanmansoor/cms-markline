import apiClient from '@/lib/api/client'

export interface ServiceabilityParams {
  pickup_postcode: string
  delivery_postcode: string
  weight: string | number
  cod: string | number
  is_return: string | number
  declared_value: string | number
  order_id?: string
}

export interface AssignCourierPayload {
  courierId: string
  courierName: string
}

export const shipmentService = {
  getServiceability: async (params: ServiceabilityParams) => {
    const res = await apiClient.get('/api/shipments/serviceability', { params })
    return res.data
  },

  assignCourier: async (shipmentId: string | number, payload: AssignCourierPayload) => {
    const res = await apiClient.post(`/api/shipments/${shipmentId}/assign-courier`, payload)
    return res.data
  },

  getShipments: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/api/shipments', { params })
    return res.data
  },

  getShipmentById: async (id: string | number) => {
    const res = await apiClient.get(`/api/shipments/${id}`)
    return res.data
  },

  createShipment: async (payload: any) => {
    const res = await apiClient.post('/api/shipments', payload)
    return res.data
  },

  syncTracking: async (id: string | number) => {
    const res = await apiClient.post(`/api/shipments/${id}/track`)
    return res.data
  },

  getWarehouses: async () => {
    const res = await apiClient.get('/api/shipments/warehouses')
    return res.data
  },

  getUnshippedOrders: async () => {
    const res = await apiClient.get('/api/shipments/unshipped-orders')
    return res.data
  }
}

export default shipmentService
