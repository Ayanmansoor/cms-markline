import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useDiscounts() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { data: discountData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["discounts", currentPage, limit, selectedStatus],
    queryFn: async () => {
      let url = `/api/discounts?page=${currentPage}&limit=${limit}`
      if (selectedStatus !== "all") url += `&status=${selectedStatus}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch discounts")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  const rawDiscounts = discountData?.discounts || []
  const totalCount = discountData?.totalCount || 0

  const discounts = rawDiscounts.filter((d: any) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return d.name?.toLowerCase().includes(q)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/discounts?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete discount")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Discount rule deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
      setDeleteTargetId(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete discount")
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
    discounts,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteTargetId,
    setDeleteTargetId,
    deleteMutation,
  }
}
