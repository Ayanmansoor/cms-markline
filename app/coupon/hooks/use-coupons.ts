import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useCoupons() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { data: couponData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["coupons", currentPage, limit, selectedStatus],
    queryFn: async () => {
      let url = `/api/coupon?page=${currentPage}&limit=${limit}`
      if (selectedStatus !== "all") url += `&status=${selectedStatus}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch coupons")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  const rawCoupons = couponData?.coupons || []
  const totalCount = couponData?.totalCount || 0

  const coupons = rawCoupons.filter((c: any) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return c.code?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/coupon/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete coupon")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Coupon deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["coupons"] })
      setDeleteTargetId(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete coupon")
    },
  })

  return {
    currentPage,
    setCurrentPage,
    limit,
    setLimit,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    coupons,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteTargetId,
    setDeleteTargetId,
    deleteMutation,
  }
}
