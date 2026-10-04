import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Product } from "../types/product-types"

export function useProducts() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pagiNoParam = searchParams.get("pagiNo")
  const currentPage = pagiNoParam ? parseInt(pagiNoParam, 10) || 1 : 1

  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    let nextPage: number
    if (typeof page === "function") {
      nextPage = page(currentPage)
    } else {
      nextPage = page
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set("pagiNo", String(nextPage))
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const [limit, setLimit] = useState(10)
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [selectedCollection, setSelectedCollection] = useState("all")
  const [selectedGender, setSelectedGender] = useState("all")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [productToDelete, setProductToDelete] = useState<string | number | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Fetch Filters
  const { data: filtersData, refetch: refetchFilters } = useQuery({
    queryKey: ["filters"],
    queryFn: async () => {
      const res = await fetch("/api/filters")
      if (!res.ok) throw new Error("Failed to fetch filters")
      return res.json()
    },
    staleTime: 1000 * 60 * 30,
  })

  // Fetch Products
  const { data: productsData, isLoading, isFetching, refetch: refetchProducts } = useQuery({
    queryKey: ["products", currentPage, limit, selectedBrand, selectedCollection, selectedGender, selectedGroup],
    queryFn: async () => {
      let url = `/api/products?page=${currentPage}&limit=${limit}`
      if (selectedBrand !== "all") url += `&brand=${selectedBrand}`
      if (selectedCollection !== "all") url += `&collection=${selectedCollection}`
      if (selectedGender !== "all") url += `&gender=${selectedGender}`
      if (selectedGroup !== "all") url += `&group=${selectedGroup}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch products")
      return res.json()
    },
  })

  // Fetch Analytics
  const { data: analyticsData, refetch: refetchAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/products/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
  })

  const products: Product[] = productsData?.products || []
  const totalCount: number = productsData?.totalCount || 0

  const filteredProducts = products.filter((product: any) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const nameMatch = product.name?.toLowerCase().includes(q)
    const skuMatch = product.product_variants?.some((v: any) => v.sku?.toLowerCase().includes(q))
    const brandMatch = (product.brands?.name || product.brand?.name || "").toLowerCase().includes(q)
    return nameMatch || skuMatch || brandMatch
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete product")
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Product deleted successfully")
        queryClient.invalidateQueries({ queryKey: ["products"] })
        queryClient.invalidateQueries({ queryKey: ["analytics"] })
        setProductToDelete(null)
      } else {
        toast.error(data.error || "Failed to delete product")
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while deleting")
    },
  })

  // Toggle Active Status Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string | number; is_active: boolean }) => {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, is_active }),
      })
      if (!res.ok) throw new Error("Failed to toggle status")
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Product status updated successfully")
        queryClient.invalidateQueries({ queryKey: ["products"] })
      } else {
        toast.error(data.error || "Failed to update product status")
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while updating status")
    },
  })

  // Update Product Group Mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, grouptype }: { id: string | number; grouptype: number | null }) => {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, grouptype }),
      })
      if (!res.ok) throw new Error("Failed to update group")
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Product group updated successfully")
        queryClient.invalidateQueries({ queryKey: ["products"] })
      } else {
        toast.error(data.error || "Failed to update group")
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while updating group")
    },
  })

  const handleExportCSV = () => {
    if (!products || products.length === 0) {
      toast.error("No products to export")
      return
    }
    const headers = ["ID", "Name", "Brand", "Price", "Total Stock", "Status"]
    const rows = products.map((p: any) => {
      const firstVar = p.product_variants?.[0]
      const totalStock = p.product_variants?.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0) || 0
      const brandName = p.brands?.name || p.brand?.name || p.brand_key || "Markline Originals"
      const price = firstVar?.retail_price !== undefined ? Number(firstVar.retail_price).toFixed(2) : ""
      const status = p.is_active !== false ? "Active" : "Draft"
      return [
        p.id,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${brandName.replace(/"/g, '""')}"`,
        price,
        totalStock,
        status,
      ].join(",")
    })
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `products_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Products exported successfully")
  }

  return {
    currentPage,
    setCurrentPage,
    limit,
    setLimit,
    selectedBrand,
    setSelectedBrand,
    selectedCollection,
    setSelectedCollection,
    selectedGender,
    setSelectedGender,
    selectedGroup,
    setSelectedGroup,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    filtersData,
    products: filteredProducts,
    totalCount,
    isLoading,
    isFetching,
    refetchProducts,
    refetchFilters,
    refetchAnalytics,
    analyticsData,
    deleteMutation,
    toggleActiveMutation,
    updateGroupMutation,
    productToDelete,
    setProductToDelete,
    handleExportCSV,
  }
}
