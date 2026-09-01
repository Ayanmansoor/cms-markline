"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DownloadIcon, PlusIcon, ChevronDownIcon, LayersIcon, TrashIcon, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BarChart, Bar, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  availability: {
    label: "Availability (%)",
    color: "#0258d5",
  },
}

function formatSize(sizeStr: string): string {
  try {
    const parsed = JSON.parse(sizeStr)
    if (parsed && typeof parsed === 'object') {
      let sizeVal = parsed.size || parsed.Size || ''
      let unitVal = parsed.unit || parsed.Unit || ''
      const sizeNum = parseInt(sizeVal)
      if (!isNaN(sizeNum) && sizeNum >= 30) {
        sizeVal = String(sizeNum - 30)
        unitVal = 'UK'
      }
      return `${sizeVal} ${unitVal}`.trim()
    }
  } catch {
    // not a JSON string, return as is
  }
  const sizeNum = parseInt(sizeStr)
  if (!isNaN(sizeNum) && sizeNum >= 30) {
    return `${sizeNum - 30} UK`
  }
  return sizeStr
}

function formatImageUrl(imageVal: any): string {
  if (!imageVal) return ""
  if (typeof imageVal === 'string') {
    try {
      const parsed = JSON.parse(imageVal)
      if (parsed && typeof parsed === 'object') {
        return parsed.url || parsed.Url || parsed.image_url || parsed.imageUrl || ""
      }
    } catch {
      // ignore
    }
    return imageVal
  }
  if (typeof imageVal === 'object') {
    return imageVal.url || imageVal.Url || imageVal.image_url || imageVal.imageUrl || ""
  }
  return ""
}

function getImageUrl(variant: any): string {
  if (!variant) return ""
  let urls = variant.image_url

  if (typeof urls === 'string') {
    try {
      urls = JSON.parse(urls)
    } catch {
      return urls
    }
  }

  if (Array.isArray(urls)) {
    if (urls.length === 0) return ""
    return formatImageUrl(urls[0])
  }

  return formatImageUrl(urls)
}

function ProductsPageContent() {
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

  // React Query: Fetch filters
  const { data: filtersData, refetch: refetchFilters } = useQuery({
    queryKey: ["filters"],
    queryFn: async () => {
      const res = await fetch("/api/filters")
      if (!res.ok) throw new Error("Failed to fetch filters")
      return res.json()
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  const brandsList = filtersData?.brands || []
  const collectionsList = filtersData?.collections || []
  const groupsList = filtersData?.groups || []

  // React Query: Fetch products
  const { data: productsData, isLoading, refetch: refetchProducts, isFetching } = useQuery({
    queryKey: ["products", currentPage, limit, selectedBrand, selectedCollection, selectedGender, selectedGroup],
    queryFn: async () => {
      let url = `/api/products?page=${currentPage}&limit=${limit}`
      if (selectedBrand !== "all") {
        url += `&brand=${selectedBrand}`
      }
      if (selectedCollection !== "all") {
        url += `&collection=${selectedCollection}`
      }
      if (selectedGender !== "all") {
        url += `&gender=${selectedGender}`
      }
      if (selectedGroup !== "all") {
        url += `&group=${selectedGroup}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch products")
      return res.json()
    },
  })

  const products = productsData?.products || []
  const totalCount = productsData?.totalCount || 0

  console.log(selectedGroup, "this is my group");
  

  // React Query: Fetch analytics
  const { data: analyticsData, refetch: refetchAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/products/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
  })

  const trendData = analyticsData?.trendData || []
  const stockAvailability = analyticsData?.stockAvailability ?? 0

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete product")
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Product deleted successfully! Task is complete")
        queryClient.invalidateQueries({ queryKey: ["products"] })
        queryClient.invalidateQueries({ queryKey: ["analytics"] })
      } else {
        toast.error(data.error || "Failed to delete product")
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while deleting")
    },
  })

  const [productToDelete, setProductToDelete] = useState<string | number | null>(null)

  const handleDelete = (id: string | number) => {
    setProductToDelete(id)
  }

  // React Query: Toggle Active Status Mutation
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

  const handleToggleActive = (id: string | number, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, is_active: !currentStatus })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb]">
        <SiteHeader />
        <div className="flex flex-1 flex-col p-8 pt-6">
          <div className="flex items-center text-sm text-slate-500 mb-4 font-medium">
            <span className="hover:text-slate-900 cursor-pointer">Products</span>
            <span className="mx-2">{'>'}</span>
            <span className="font-semibold text-slate-900">Inventory</span>
          </div>

           <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Product Inventory</h1>
            <div className="flex items-center gap-3">
              <Button
                onClick={async () => {
                  const promise = Promise.all([
                    refetchProducts(),
                    refetchAnalytics(),
                    refetchFilters()
                  ])
                  toast.promise(promise, {
                    loading: 'Refreshing inventory data...',
                    success: 'Data refreshed!',
                    error: 'Failed to refresh data',
                  })
                }}
                disabled={isFetching || isLoading}
                variant="outline"
                className="text-sm font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-lg"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button asChild className="text-sm font-semibold bg-black text-white hover:bg-black/90 shadow-sm rounded-lg">
                <Link href="/products/create">
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Product
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white mb-6">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Brand Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Brand:</span>
                  <Select
                    value={selectedBrand}
                    onValueChange={(val) => {
                      setSelectedBrand(val)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-5 shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-white border border-slate-200 shadow-lg text-slate-900">
                      <SelectItem value="all" className="text-xs font-semibold">All Brands</SelectItem>
                      {brandsList.map((brand: any) => (
                        <SelectItem key={brand.id} value={brand.id} className="text-xs font-semibold">
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Collection Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Collection:</span>
                  <Select
                    value={selectedCollection}
                    onValueChange={(val) => {
                      setSelectedCollection(val)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-5 shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs">
                      <SelectValue placeholder="All Collections" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-white border border-slate-200 shadow-lg text-slate-900">
                      <SelectItem value="all" className="text-xs font-semibold">All Collections</SelectItem>
                      {collectionsList.map((col: any) => (
                        <SelectItem key={col.id} value={String(col.id)} className="text-xs font-semibold">
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audience Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Audience:</span>
                  <Select
                    value={selectedGender}
                    onValueChange={(val) => {
                      setSelectedGender(val)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-5 shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-white border border-slate-200 shadow-lg text-slate-900">
                      <SelectItem value="all" className="text-xs font-semibold">All</SelectItem>
                      <SelectItem value="unisex" className="text-xs font-semibold">Unisex</SelectItem>
                      <SelectItem value="men" className="text-xs font-semibold">Men</SelectItem>
                      <SelectItem value="women" className="text-xs font-semibold">Women</SelectItem>
                      <SelectItem value="kids" className="text-xs font-semibold">Kids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Group Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Group:</span>
                  <Select
                    value={selectedGroup}
                    onValueChange={(val) => {
                      setSelectedGroup(val)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-5 shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs">
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-white border border-slate-200 shadow-lg text-slate-900">
                      <SelectItem value="all" className="text-xs font-semibold">All Groups</SelectItem>
                      {groupsList.map((group: any) => (
                        <SelectItem key={group.id} value={String(group.id)} className="text-xs font-semibold">
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedBrand !== "all" || selectedCollection !== "all" || selectedGender !== "all" || selectedGroup !== "all") && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedBrand("all")
                      setSelectedCollection("all")
                      setSelectedGender("all")
                      setSelectedGroup("all")
                      setCurrentPage(1)
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 px-3 rounded-lg"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="shadow-xs border border-slate-200/80 rounded-2xl bg-white mb-6 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#f4f7fb] border-b border-slate-200/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 pl-6 py-3.5">
                      <Checkbox className="rounded border-slate-300" />
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5">Product</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5">Brand</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5">Price</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5">Inventory</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 text-center pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500 font-medium">
                        Loading products...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500 font-medium">
                        No products found. Add some products to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product: any) => {
                      const firstVariant = product.product_variants?.[0]
                      const totalStock = product.product_variants?.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0) || 0

                      // Map sizes array: parse JSON sizes if they are JSON strings
                      const allSizes = Array.from(
                        new Set(
                          product.product_variants
                            ?.flatMap((v: any) => v.sizes || [])
                            .map((s: string) => formatSize(s)) || []
                        )
                      ) as string[]

                      const priceStr = firstVariant?.retail_price !== undefined ? `₹${Number(firstVariant.retail_price).toFixed(2)}` : "N/A"
                      const skuStr = firstVariant?.sku ? `SKU: ${firstVariant.sku}` : "No SKU"

                      let stockStatus = "out of stock"
                      let outOfStock = true
                      let lowStock = false

                      if (totalStock > 50) {
                        stockStatus = "in stock"
                        outOfStock = false
                      } else if (totalStock > 0) {
                        stockStatus = "low stock"
                        outOfStock = false
                        lowStock = true
                      }

                      const isProductActive = product.is_active !== false
                      const imageUrl = getImageUrl(firstVariant)
                      const imgClass = imageUrl ? "" : "bg-slate-300"
                      const imgStyle = imageUrl
                        ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : {}

                      const brandName = product.brands?.name || product.brand?.name || (product.brand_key ? `Brand: ${product.brand_key.substring(0, 8)}` : "Markline Originals")

                      return (
                        <TableRow key={product.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <TableCell className="pl-6 py-4">
                            <Checkbox className="rounded border-slate-300" />
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg ${imgClass} shadow-sm shrink-0`} style={imgStyle}></div>
                              <div>
                                <Link href={`/products/${product.id}`} className="hover:underline hover:text-blue-600 transition-colors">
                                  <p className="text-sm font-bold text-[#0f172a] text-wrap line-clamp-1 ">{product.name.slice(0, 30)}...</p>
                                </Link>
                                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{skuStr}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-[#0f172a] text-sm py-4">
                            {brandName}
                          </TableCell>
                          <TableCell className="font-bold text-[#0f172a] text-sm py-4">{priceStr}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${outOfStock ? 'bg-red-500' : lowStock ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                <span className="text-xs font-bold text-[#0f172a]">
                                  {totalStock} <span className="text-slate-500 font-semibold">{stockStatus}</span>
                                </span>
                                {lowStock && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 rounded uppercase">Low</span>}
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {allSizes.slice(0, 3).map((size, idx) => (
                                  <div key={idx} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {size}
                                  </div>
                                ))}
                                {allSizes.length > 3 && (
                                  <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 border-dashed">
                                    +{allSizes.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                type="button"
                                onClick={() => handleToggleActive(product.id, isProductActive)}
                                className={`w-9 h-5 rounded-full flex items-center p-0.5 cursor-pointer border transition-colors ${
                                  isProductActive ? 'bg-blue-600 border-blue-600 justify-end' : 'bg-slate-200 border-slate-300 justify-start'
                                }`}
                              >
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                                  {isProductActive && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  )}
                                </div>
                              </button>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none min-w-[36px] text-left">
                                {isProductActive ? "Active" : "Draft"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center pr-6">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                              >
                                <Link href={`/products/${product.id}`}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(product.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <CardFooter className="flex items-center justify-between p-4 border-t border-slate-100 bg-white flex-wrap gap-4">
              <p className="text-xs font-bold text-slate-500">
                Showing {products.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, totalCount)} of {totalCount} products
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="h-8 text-xs font-bold text-slate-600 border-slate-200"
                  >
                    Previous
                  </Button>

                  {Array.from({ length: Math.ceil(totalCount / limit) }, (_, i) => i + 1)
                    .filter(pageNumber => Math.abs(pageNumber - currentPage) <= 1 || pageNumber === 1 || pageNumber === Math.ceil(totalCount / limit))
                    .map((pageNumber, idx, arr) => {
                      const showEllipsis = idx > 0 && pageNumber - arr[idx - 1] > 1;

                      return (
                        <div key={pageNumber} className="flex items-center gap-1">
                          {showEllipsis && <span className="text-xs font-bold text-slate-400 mx-1">...</span>}
                          <Button
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            disabled={isLoading}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`h-8 w-8 p-0 text-xs font-bold ${currentPage === pageNumber ? 'bg-black text-white hover:bg-black/90 border-0' : 'text-slate-600 border-slate-200'
                              }`}
                          >
                            {pageNumber}
                          </Button>
                        </div>
                      )
                    })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage * limit >= totalCount || isLoading}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="h-8 text-xs font-bold text-slate-600 border-slate-200"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Bottom Analytics */}
          <Card className="md:col-span-2 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200 rounded-2xl bg-white">
            <CardContent className="p-6">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Stock Availability Trend</p>
              <div className="flex items-baseline gap-3 mb-6">
                <h3 className="text-4xl font-bold text-[#0f172a] tracking-tight">{stockAvailability}%</h3>
                <div className="flex items-center text-sm font-bold text-blue-600">
                  <span className="text-blue-500 mr-1">↗</span> Live Status
                </div>
              </div>

              {/* Dynamic Shadcn/Recharts Bar Chart */}
              <div className="h-32 mt-4 w-full">
                {trendData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <BarChart data={trendData}>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                      />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Bar
                        dataKey="availability"
                        fill="var(--color-availability)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                    No brand stock data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>



          <Dialog open={productToDelete !== null} onOpenChange={(open) => { if (!open) setProductToDelete(null) }}>
            <DialogContent className="sm:max-w-md bg-white border border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900">Delete Product</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
                  Are you sure you want to delete this product? All its variants and associated inventory records will be permanently removed. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setProductToDelete(null)}
                  className="font-semibold text-slate-700 border-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (productToDelete !== null) {
                      deleteMutation.mutate(productToDelete)
                      setProductToDelete(null)
                    }
                  }}
                  className="font-semibold bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
            <p>© 2024 Markline Enterprise. Built for performance.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-900 transition-colors">API Documentation</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f4f7fb]">
        <div className="text-slate-500 font-semibold text-sm animate-pulse">Loading inventory...</div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}