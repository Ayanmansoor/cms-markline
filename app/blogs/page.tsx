"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DownloadIcon, PlusIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, ImageIcon, Trash2Icon, Pencil } from "lucide-react"
import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function BlogPostsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchValue, setSearchValue] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  
  const queryClient = useQueryClient()

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchValue])

  // React Query call to get dynamic blogs list
  const { data: blogsData, isLoading, error } = useQuery({
    queryKey: ["blogs", currentPage, limit, statusFilter, debouncedSearch],
    queryFn: async () => {
      let url = `/api/blogs?page=${currentPage}&limit=${limit}`
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch blogs")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null)

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/blogs?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete blog post")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Blog post deleted successfully! Task is complete")
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete blog post")
    }
  })

  const handleDelete = (id: number, title: string) => {
    setDeleteTarget({ id, title })
  }

  const blogsList = blogsData?.blogs || []
  const totalCount = blogsData?.totalCount || 0

  const from = (currentPage - 1) * limit
  const to = from + limit - 1

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                <span>Dashboard</span>
                <span className="text-slate-300">&gt;</span>
                <span>Content</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#0f172a]">Blog Posts</h1>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="text-xs font-bold text-slate-700 border-slate-300 bg-white">
                <DownloadIcon className="h-3.5 w-3.5 mr-2" /> Export
              </Button>
              <Button asChild className="text-xs font-bold text-white bg-black hover:bg-black/90">
                <Link href="/blogs/create">
                  <PlusIcon className="h-4 w-4 mr-1.5" /> Add New Post
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5 mb-6">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search by title or slug..."
                  className="h-9 pl-9 text-xs font-medium border-slate-200/80 bg-slate-50 text-slate-900 rounded-xl focus:bg-white"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
                  <Select value={statusFilter} onValueChange={(val: any) => { setStatusFilter(val); setCurrentPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs gap-1.5">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                      <SelectItem value="all" className="text-xs font-semibold">All Statuses</SelectItem>
                      <SelectItem value="published" className="text-xs font-semibold">Published</SelectItem>
                      <SelectItem value="draft" className="text-xs font-semibold">Draft</SelectItem>
                      <SelectItem value="scheduled" className="text-xs font-semibold">Scheduled</SelectItem>
                      <SelectItem value="pending" className="text-xs font-semibold">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-[#f4f7fb] border-b border-slate-200/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center px-4">
                      <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
                    </TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">POST</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">CATEGORIES</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">SEO</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">CREATED</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">LAST UPDATED</TableHead>
                    <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center px-6">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-slate-400">
                      Loading blog posts...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-red-500">
                      Error fetching blogs data. Please verify database connection.
                    </TableCell>
                  </TableRow>
                ) : blogsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center text-xs font-semibold text-slate-400">
                      No blog posts found matching current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  blogsList.map((post: any) => (
                    <TableRow key={post.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="w-12 text-center px-4">
                        <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm relative">
                            {post.image ? (
                              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-slate-300" />
                            )}
                          </div>
                          <div className="max-w-[280px]">
                            <p className="text-xs font-bold text-slate-900 leading-tight mb-1 cursor-pointer hover:underline">{post.title}</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate">{post.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[120px]">
                          {post.categories.map((cat: string) => (
                            <Badge key={cat} variant="outline" className="text-[8px] font-bold text-slate-600 bg-slate-100 border-slate-200 rounded px-1.5 py-0 uppercase tracking-wider">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${post.seoDot}`}></div>
                          <span className={`text-[11px] font-bold ${post.seoColor}`}>{post.seoScore}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${post.statusColor}`}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <p className="text-[11px] font-semibold text-slate-600 whitespace-pre-wrap">{post.created}</p>
                      </TableCell>
                      <TableCell className="py-4">
                        <p className="text-[11px] font-semibold text-slate-600 whitespace-pre-wrap">{post.lastUpdated}</p>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/blogs/${post.id}`)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(post.id, post.title)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination Footer */}
            <div className="bg-[#f8fafc] px-6 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
              <span className="text-[10px] font-bold text-slate-500">
                Showing {from + 1}-{Math.min(to + 1, totalCount)} of {totalCount} posts
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
                        className={`h-8 w-8 p-0 text-xs font-bold ${
                          isCurrent 
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
          </div>
        </div>

          <DeleteConfirmDialog
            isOpen={deleteTarget !== null}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            itemName={deleteTarget?.title}
            title="Delete Blog Post"
            isPending={deleteMutation.isPending}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
