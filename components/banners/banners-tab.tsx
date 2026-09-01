"use client"

import Link from "next/link"
import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  Trash2Icon,
  Pencil,
  Monitor,
  Smartphone
} from "lucide-react"

export function BannersTab() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // ── Banners State ─────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [deviceFilter, setDeviceFilter] = useState<string>("all")
  const [searchValue, setSearchValue] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // Debounce search input for banners
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchValue])

  // ── Banners Queries & Mutations ───────────────────────────────────────────
  const { data: bannersData, isLoading, error } = useQuery({
    queryKey: ["banners", currentPage, limit, deviceFilter, debouncedSearch],
    queryFn: async () => {
      let url = `/api/banners?page=${currentPage}&limit=${limit}`
      if (deviceFilter !== "all") {
        url += `&device=${deviceFilter}`
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch banners")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  // Delete Banner Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete banner")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Banner deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["banners"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete banner")
    }
  })

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  // Toggle Banner Enable Mutation
  const toggleEnableMutation = useMutation({
    mutationFn: async ({ id, isEnable }: { id: string; isEnable: boolean }) => {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnable }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update banner status")
      return data
    },
    onSuccess: () => {
      toast.success("Banner status updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["banners"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update banner status")
    }
  })

  const bannersList = bannersData?.banners || []
  const totalCount = bannersData?.totalCount || 0
  const from = (currentPage - 1) * limit
  const to = from + limit - 1

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by name, slug, or url..."
            className="h-9 pl-9 text-xs font-medium border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Device:</span>
            <Select value={deviceFilter} onValueChange={(val: any) => { setDeviceFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs gap-1.5">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                <SelectItem value="all" className="text-xs font-semibold">All Devices</SelectItem>
                <SelectItem value="desktop" className="text-xs font-semibold">Desktop Only</SelectItem>
                <SelectItem value="mobile" className="text-xs font-semibold">Mobile Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="w-12 text-center px-4">
              <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
            </TableHead>
            <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">BANNER</TableHead>
            <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">SLUG</TableHead>
            <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">TARGET URL</TableHead>
            <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">DEVICE TYPE</TableHead>
            <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">CREATED</TableHead>
            <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">STATUS</TableHead>
            <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center px-6">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-slate-400">
                Loading banners...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-red-500">
                Error fetching banners. Please verify database connection.
              </TableCell>
            </TableRow>
          ) : bannersList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-slate-400">
                No banners found matching current filters.
              </TableCell>
            </TableRow>
          ) : (
            bannersList.map((banner: any) => {
              const createdDate = banner.created_at ? new Date(banner.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'

              return (
                <TableRow key={banner.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="w-12 text-center px-4">
                    <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm relative">
                        {banner.image_url ? (
                          <img src={banner.image_url} alt={banner.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div className="max-w-[200px]">
                        <p className="text-xs font-bold text-slate-900 leading-tight mb-1 cursor-pointer hover:underline" onClick={() => router.push(`/banners/${banner.id}`)}>{banner?.name?.slice(0, 20) || 'Untitled Banner'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-[11px] font-medium text-slate-500">{banner.slug || '—'}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-[180px] block">{banner.url || '—'}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    {banner.isMobile ? (
                      <Badge variant="outline" className="text-[9px] font-bold text-amber-600 bg-amber-50 border-amber-200 rounded px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1 w-fit">
                        <Smartphone className="h-3 w-3" /> Mobile
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border-indigo-200 rounded px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1 w-fit">
                        <Monitor className="h-3 w-3" /> Desktop
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">{createdDate}</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        checked={banner.isEnable !== false}
                        disabled={toggleEnableMutation.isPending}
                        onCheckedChange={(checked) => {
                          toggleEnableMutation.mutate({ id: banner.id, isEnable: checked })
                        }}
                      />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        banner.isEnable !== false ? "text-green-600" : "text-slate-400"
                      }`}>
                        {banner.isEnable !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/banners/${banner.id}`)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(banner.id, banner.name)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      <div className="bg-[#f8fafc] px-6 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
        <span className="text-[10px] font-bold text-slate-500">
          Showing {from + 1}-{Math.min(to + 1, totalCount)} of {totalCount} banners
        </span>
        <div className="flex items-center gap-1">
          <Button
            disabled={currentPage === 1 || isLoading}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            variant="outline"
            size="icon"
            className="h-8 w-8 text-slate-600 border-slate-200 shadow-sm"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {(() => {
            const totalPages = Math.ceil(totalCount / limit) || 1
            const pages: (number | string)[] = []
            const range = 1

            for (let i = 1; i <= totalPages; i++) {
              if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - range && i <= currentPage + range)
              ) {
                pages.push(i)
              } else if (
                i === currentPage - range - 1 ||
                i === currentPage + range + 1
              ) {
                pages.push('...')
              }
            }

            const filteredPages = pages.filter((item, index, self) => {
              return item !== '...' || self[index - 1] !== '...'
            })

            return filteredPages.map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={idx} className="text-xs font-bold text-slate-400 mx-1">
                    ...
                  </span>
                )
              }

              const isCurrent = page === currentPage
              return (
                <Button
                  key={idx}
                  onClick={() => setCurrentPage(page as number)}
                  variant={isCurrent ? "outline" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 text-xs font-bold ${isCurrent
                    ? "bg-black text-white hover:bg-black/90 border-0 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {page}
                </Button>
              )
            })
          })()}

          <Button
            disabled={currentPage * limit >= totalCount || isLoading}
            onClick={() => setCurrentPage(prev => prev + 1)}
            variant="outline"
            size="icon"
            className="h-8 w-8 text-slate-600 border-slate-200 shadow-sm"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        itemName={deleteTarget?.name}
        title="Delete Banner"
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
