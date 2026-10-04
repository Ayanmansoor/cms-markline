import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DateRangeValue } from "@/components/ui/date-range-picker"

export function useOrders() {
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [paymentStatus, setPaymentStatus] = useState<string>("all")
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const now = new Date()
    return {
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
      preset: "30days",
    }
  })

  const { data: ordersData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["orders", currentPage, limit, paymentStatus, fulfillmentStatus],
    queryFn: async () => {
      let url = `/api/orders?page=${currentPage}&limit=${limit}`
      if (paymentStatus !== "all") url += `&payment_status=${paymentStatus}`
      if (fulfillmentStatus !== "all") url += `&fulfillment_status=${fulfillmentStatus}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch orders")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  const rawOrders = ordersData?.orders || []
  const totalCount = ordersData?.totalCount || 0

  const orders = rawOrders.filter((order: any) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const idMatch = String(order.id).includes(q)
    const customerMatch = (order.customer_name || order.customer?.name || "").toLowerCase().includes(q)
    const emailMatch = (order.customer_email || order.customer?.email || "").toLowerCase().includes(q)
    return idMatch || customerMatch || emailMatch
  })

  return {
    currentPage,
    setCurrentPage,
    limit,
    paymentStatus,
    setPaymentStatus,
    fulfillmentStatus,
    setFulfillmentStatus,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    isCreateOrderOpen,
    setIsCreateOrderOpen,
    orders,
    totalCount,
    isLoading,
    isFetching,
    refetch,
  }
}
