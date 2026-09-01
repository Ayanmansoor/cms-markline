"use client"

import React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Globe, Sparkles, PlusIcon, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { categoryService } from "@/services/category.service"

export function CollectionsTab() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name: string } | null>(null)

  // Fetch collections
  const { data: collectionsResponse, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: () => categoryService.getCollections()
  })

  const collections = collectionsResponse?.collections || []

  // Delete Collection Mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: (id: number) => categoryService.deleteCollection(id),
    onSuccess: () => {
      toast.success("Collection deleted successfully! Task is complete")
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete collection")
    }
  })

  const confirmDeleteCollection = () => {
    if (deleteTarget) {
      deleteCollectionMutation.mutate(deleteTarget.id)
    }
  }

  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredCollections = collections.filter((col: any) =>
    (col.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (col.slug || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-semibold text-slate-400">Loading collections...</div>
  }

  return (
    <div className="space-y-4">
      {/* Outer Card Wrapper */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Collection List</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Group and display products in premium thematic sliders.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/category/create")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-2 shadow-xs">
              <PlusIcon className="h-4 w-4" /> Add Collection
            </Button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search all collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 rounded-xl px-4 py-2 w-64 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl px-3.5 py-2 flex items-center gap-1.5 transition-all">
            <Sparkles className="h-3.5 w-3.5 text-slate-500" /> Filter
          </button>
        </div>

        {/* Table Container */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-[#f4f7fb]">
              <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                <TableHead className="w-12 h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4">Name</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Slug</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gender Target</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="h-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right px-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs font-semibold text-slate-400">
                    No collections found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCollections.map((col: any) => {
                  let firstThumbnailUrl = "";
                  if (col.image_urls && col.image_urls.length > 0) {
                    try {
                      const parsed = JSON.parse(col.image_urls[0]);
                      firstThumbnailUrl = parsed.image_url || "";
                    } catch (e) {
                      firstThumbnailUrl = typeof col.image_urls[0] === 'string' ? col.image_urls[0] : "";
                    }
                  }

                  return (
                    <TableRow key={col.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors h-14">
                      <TableCell className="text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg border border-slate-200/80 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden shrink-0">
                            {firstThumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={firstThumbnailUrl} alt={col.name} className="w-full h-full object-cover" />
                            ) : (
                              col.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{col.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 line-clamp-1 max-w-[200px]">{col.description || "No description"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">{col.slug}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200/80">
                          {col.gender || "ALL"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs font-semibold text-slate-600 capitalize">
                          {col.type ? col.type.toLowerCase().replace('_', ' ') : 'Standard'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {col.is_show ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[9.5px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
                              <Globe className="h-2.5 w-2.5" /> Visible
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-500 border border-slate-200/80 text-[9.5px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5">
                              Hidden
                            </span>
                          )}
                          {col.is_new_collection && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[9.5px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" /> New
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/category/${col.id}`)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget({ id: col.id, name: col.name })}
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* Delete Confirmation Shadcn Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">Delete Collection</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</DialogDescription>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold text-slate-700">
              Are you sure you want to delete <span className="font-bold text-black font-mono">"{deleteTarget?.name}"</span>? All catalog links associated with this category layout will be detached.
            </p>
          </div>
          <DialogFooter className="flex sm:justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              disabled={deleteCollectionMutation.isPending}
              onClick={() => setDeleteTarget(null)}
              className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 h-9"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteCollectionMutation.isPending}
              onClick={confirmDeleteCollection}
              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 h-9 px-4"
            >
              {deleteCollectionMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
