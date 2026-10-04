import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useBrands() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedGender, setSelectedGender] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const { data: brandsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["brands", currentPage, limit, selectedGender],
    queryFn: async () => {
      let url = `/api/brands?page=${currentPage}&limit=${limit}`
      if (selectedGender !== "all") url += `&gender=${selectedGender}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch brands")
      return res.json()
    },
  })

  const rawBrands = brandsData?.brands || []
  const totalCount = brandsData?.totalCount || 0

  const brands = rawBrands.filter((b: any) => {
    if (selectedStatus === "all") return true
    const isActive = b.productsCount > 0
    return selectedStatus === "active" ? isActive : !isActive
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete brand")
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Brand deleted successfully")
        queryClient.invalidateQueries({ queryKey: ["brands"] })
        queryClient.invalidateQueries({ queryKey: ["filters"] })
        setDeleteTarget(null)
      } else {
        toast.error(data.error || "Failed to delete brand")
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while deleting brand")
    },
  })

  return {
    currentPage,
    setCurrentPage,
    limit,
    setLimit,
    selectedGender,
    setSelectedGender,
    selectedStatus,
    setSelectedStatus,
    brands,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  }
}
