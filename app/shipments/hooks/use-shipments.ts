import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useShipments() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Fetch Shipments
  const { data: shipmentsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["shipments", currentPage, statusFilter, typeFilter, searchQuery],
    queryFn: async () => {
      let url = `/api/shipments?page=${currentPage}&limit=${limit}`
      if (statusFilter !== "all") url += `&status=${encodeURIComponent(statusFilter)}`
      if (typeFilter !== "all") url += `&type=${encodeURIComponent(typeFilter)}`
      if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch shipments")
      return res.json()
    },
    staleTime: 5000,
  })

  // Fetch Warehouses & Orders for Creation
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await fetch("/api/shipments/warehouses")
      if (!res.ok) return { warehouses: [] }
      return res.json()
    },
    enabled: isCreateModalOpen,
  })

  const { data: ordersData } = useQuery({
    queryKey: ["unshipped-orders"],
    queryFn: async () => {
      const res = await fetch("/api/shipments/unshipped-orders")
      if (!res.ok) return { orders: [] }
      return res.json()
    },
    enabled: isCreateModalOpen,
  })

  // Create Shipment Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create shipment")
      return data
    },
    onSuccess: () => {
      toast.success("Shipment created successfully")
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      setIsCreateModalOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while creating shipment")
    },
  })

  // Sync Tracking Mutation
  const syncTrackingMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await fetch(`/api/shipments/${id}/track`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to sync tracking status")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Tracking status updated")
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to sync tracking status")
    },
  })

  return {
    currentPage,
    setCurrentPage,
    limit,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    isCreateModalOpen,
    setIsCreateModalOpen,
    shipmentsData,
    isLoading,
    isFetching,
    refetch,
    warehouses: warehousesData?.warehouses || [],
    unshippedOrders: ordersData?.orders || [],
    createMutation,
    syncTrackingMutation,
  }
}
