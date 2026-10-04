import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { categoryService } from "@/services/category.service"

export function useCategory() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  // Fetch collections
  const { data: collectionsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["collections"],
    queryFn: () => categoryService.getCollections(),
    staleTime: 5000,
  })

  const rawCollections = collectionsResponse?.collections || []

  const collections = rawCollections.filter((col: any) => {
    const matchesSearch = !searchQuery.trim() || col.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())
    const isVisible = col.is_show !== false
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "visible" && isVisible) ||
      (statusFilter === "hidden" && !isVisible)
    return matchesSearch && matchesStatus
  })

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_show }: { id: number; is_show: boolean }) =>
      categoryService.updateCollectionStatus(id, is_show),
    onSuccess: (_, variables) => {
      toast.success(`Collection is now ${variables.is_show ? "Visible" : "Hidden"}`)
      queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update collection status")
    },
  })

  // Delete Collection Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.deleteCollection(id),
    onSuccess: () => {
      toast.success("Collection deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete collection")
    },
  })

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    collections,
    totalCount: collections.length,
    isLoading,
    isFetching,
    refetch,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
    updateStatusMutation,
  }
}
