import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useBlogs() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchValue, setSearchValue] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null)

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchValue])

  // Fetch blogs
  const { data: blogsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["blogs", currentPage, limit, statusFilter, debouncedSearch],
    queryFn: async () => {
      let url = `/api/blogs?page=${currentPage}&limit=${limit}`
      if (statusFilter !== "all") url += `&status=${statusFilter}`
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch blogs")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/blogs?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete blog post")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Blog post deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete blog post")
    },
  })

  return {
    currentPage,
    setCurrentPage,
    limit,
    setLimit,
    statusFilter,
    setStatusFilter,
    searchValue,
    setSearchValue,
    blogsData,
    blogs: blogsData?.data || blogsData?.blogs || [],
    totalCount: blogsData?.totalCount || blogsData?.pagination?.total || 0,
    isLoading,
    isFetching,
    refetch,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  }
}
