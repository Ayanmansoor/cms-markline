"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChevronDownIcon,
  ListIcon,
  LayoutGridIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  RefreshCw,
  Pencil,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function BrandsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const [selectedGender, setSelectedGender] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // React Query: Fetch Brands
  const { data: brandsData, isLoading } = useQuery({
    queryKey: ["brands", currentPage, limit, selectedGender],
    queryFn: async () => {
      let url = `/api/brands?page=${currentPage}&limit=${limit}`
      if (selectedGender !== "all") {
        url += `&gender=${selectedGender}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch brands")
      return res.json()
    },
  })

  let rawBrands = brandsData?.brands || []
  const totalCount = brandsData?.totalCount || 0


  console.log(rawBrands, " this raw brands ")

  // Client-side filter for active status
  // Active is defined as productsCount > 0, Inactive is 0 products.
  const brands = rawBrands.filter((b: any) => {
    if (selectedStatus === "all") return true
    const isActive = b.productsCount > 0
    return selectedStatus === "active" ? isActive : !isActive
  })

  // Calculate Top Performing Brand dynamically (brand with most products)
  const topBrand = [...rawBrands].sort((a: any, b: any) => b.productsCount - a.productsCount)[0] || null
  const topBrandName = topBrand ? topBrand.name : "MARKLINE ORIGINALS"
  const topBrandSub = topBrand
    ? `Leading segment with ${topBrand.productsCount} products`
    : "No registered products found"

  // React Query: Delete Brand Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/brands/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete brand")
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Brand deleted successfully")
        queryClient.invalidateQueries({ queryKey: ["brands"] })
        queryClient.invalidateQueries({ queryKey: ["filters"] })
      } else {
        toast.error(data.error || "Failed to delete brand")
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while deleting")
    },
  })

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this brand? This action cannot be undone.")) return
    deleteMutation.mutate(id)
  }

  const handleClearFilters = () => {
    setSelectedGender("all")
    setSelectedStatus("all")
    setCurrentPage(1)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto">
          {/* Top Filter Bar */}
          <div className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-20 flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => {
                    setSelectedStatus(val)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs gap-1.5">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-lg text-slate-900">
                    <SelectItem value="all" className="text-xs font-semibold">All</SelectItem>
                    <SelectItem value="active" className="text-xs font-semibold">Active</SelectItem>
                    <SelectItem value="inactive" className="text-xs font-semibold">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Segment Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Segment:</span>
                <Select
                  value={selectedGender}
                  onValueChange={(val) => {
                    setSelectedGender(val)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs gap-1.5">
                    <SelectValue placeholder="Global" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-lg text-slate-900">
                    <SelectItem value="all" className="text-xs font-semibold">Global</SelectItem>
                    <SelectItem value="men" className="text-xs font-semibold">Men</SelectItem>
                    <SelectItem value="women" className="text-xs font-semibold">Women</SelectItem>
                    <SelectItem value="unisex" className="text-xs font-semibold">Unisex</SelectItem>
                    <SelectItem value="kids" className="text-xs font-semibold">Kids</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(selectedGender !== "all" || selectedStatus !== "all") && (
                <span
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer ml-2"
                >
                  Clear Filters
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["brands"] })
                }}
                variant="outline"
                className="text-sm font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>

              <span className="text-xs font-bold text-slate-500">
                Displaying {brands.length} Brands
              </span>

              <Button asChild className="text-sm font-semibold bg-black text-white cursor-pointer hover:bg-black/90 shadow-sm rounded-lg">
                <Link href="/brands/create">
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Brand
                </Link>
              </Button>
            </div>
          </div>

          <div className="p-8">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="md:col-span-2 shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
                <CardContent className="p-6 flex items-center justify-between h-full">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">TOP REGISTERED BRAND</p>
                    <h2 className="text-lg font-black text-slate-900 uppercase">{topBrandName}</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">{topBrandSub}</p>
                  </div>
                  <div className="text-right flex flex-col items-end justify-center">
                    <p className="text-3xl font-black text-slate-900 leading-none">
                      {topBrand ? "Live" : "N/A"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Status</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 rounded-xl overflow-hidden bg-blue-600 text-white relative">
                <CardContent className="p-6 h-full flex flex-col justify-center relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <SparklesIcon className="h-6 w-6 text-blue-300" />
                    <Badge className="bg-white text-blue-600 font-bold hover:bg-slate-50 border-0 rounded-full px-2.5">Live</Badge>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Catalog Directory</h3>
                  <p className="text-xs font-medium text-blue-100 leading-relaxed">
                    Overview of active brand segments and total registered catalog products.
                  </p>
                </CardContent>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-500 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
              </Card>
            </div>

            {/* Brands Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden mb-0">
              <Table>
                <TableHeader className="bg-[#f4f7fb] border-b border-slate-200/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-11 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[300px]">Brand</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Est.</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Segment</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Products</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Discount</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-8">Status</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500 font-medium">
                        Loading brands...
                      </TableCell>
                    </TableRow>
                  ) : brands.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500 font-medium">
                        No brands found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    brands.map((brand: any) => {
                      const estYear = brand.since_year ? new Date(brand.since_year).getFullYear() : "N/A"
                      const isActive = brand.productsCount > 0
                      const discountName = brand.discounts?.name
                        ? `${brand.discounts.name} (${brand.discounts.discount_persent}%)`
                        : "No Discount"

                      return (
                        <TableRow key={brand.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                          <TableCell className="p-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                {brand.image_url ? (
                                  <img src={brand.image_url} alt={brand.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-4 h-4 bg-slate-900 transform rotate-45 rounded-sm"></div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-900 uppercase">{brand.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{brand?.description?.slice(0, 30) || "No description provided"}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-500">{estYear}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] font-bold text-slate-500 bg-slate-100 border-slate-200 rounded uppercase tracking-wide">
                              {brand.gender || "UNISEX"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-700 text-right">{brand.productsCount || 0}</TableCell>
                          <TableCell className="text-xs font-bold text-blue-600 text-right">
                            {discountName}
                          </TableCell>
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                              <span className="text-xs font-bold text-slate-700">
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/brands/${brand.id}`)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-800 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(brand.id)}
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

            {/* Pagination */}
            <div className="bg-[#f8fafc] border-x border-b border-slate-200 rounded-b-xl px-6 py-3 flex items-center justify-between shadow-sm flex-wrap gap-4">
              <span className="text-xs font-semibold text-slate-500">
                Page {currentPage} of {Math.ceil(totalCount / limit) || 1}
              </span>

              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="h-8 w-8 rounded-none border-r border-slate-200 p-0 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.ceil(totalCount / limit) || 1 }, (_, i) => i + 1).map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant="ghost"
                      onClick={() => setCurrentPage(pageNumber)}
                      disabled={isLoading}
                      className={`h-8 w-8 rounded-none p-0 text-xs font-bold border-r border-slate-200 last:border-0 ${currentPage === pageNumber
                        ? "bg-slate-100 text-slate-700"
                        : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {pageNumber}
                    </Button>
                  ))}

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage * limit >= totalCount || isLoading}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="h-8 w-8 rounded-none p-0 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>

                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-8 text-xs font-bold border border-slate-200 rounded px-2 bg-white shadow-sm outline-none text-slate-600"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Area inside content */}
          <div className="px-8 py-4 flex items-center justify-between border-t border-slate-200 bg-white mt-auto">
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
              <span>© 2024 Markline Enterprise CMS</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span>Cloud Synced</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
              <span className="hover:text-slate-900 cursor-pointer transition-colors">Support Docs</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors">API Status</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors">v2.4.1-stable</span>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
