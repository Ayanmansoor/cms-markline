"use client"

import React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
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
import { parseImageUrl } from "@/lib/utils"

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

  // Update Status Mutation (with Optimistic UI Updates)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_show }: { id: number; is_show: boolean }) =>
      categoryService.updateCollectionStatus(id, is_show),
    onMutate: async ({ id, is_show }) => {
      // 1. Cancel outgoing queries so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["collections"] })

      // 2. Snapshot previous cache state for rollback
      const previousData = queryClient.getQueryData(["collections"])

      // 3. Optimistically update React Query cache immediately (0ms UI latency)
      queryClient.setQueryData(["collections"], (old: any) => {
        if (!old || !old.collections) return old
        return {
          ...old,
          collections: old.collections.map((col: any) =>
            col.id === id ? { ...col, is_show } : col
          ),
        }
      })

      return { previousData }
    },
    onError: (err: any, _variables, context) => {
      // Rollback to previous state on error
      if (context?.previousData) {
        queryClient.setQueryData(["collections"], context.previousData)
      }
      toast.error(err.message || "Failed to update collection status")
    },
    onSuccess: (_, variables) => {
      toast.success(`Collection is now ${variables.is_show ? "Visible" : "Hidden"}`)
    },
    onSettled: () => {
      // Refetch after error or success to stay 100% synchronized with database
      queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
  })

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
  const [genderFilter, setGenderFilter] = React.useState("all")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const GENDER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "WOMEN", label: "Women" },
    { value: "MEN", label: "Men" },
    { value: "KIDS", label: "Kids" },
    { value: "UNISEX", label: "Unisex" },
  ]

  const filteredCollections = collections.filter((col: any) => {
    const matchesSearch =
      (col.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (col.slug || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGender =
      genderFilter === "all" ||
      (col.gender || "").toUpperCase() === genderFilter.toUpperCase()
    return matchesSearch && matchesGender
  })

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-semibold text-slate-400">Loading collections...</div>
  }

  return (
    <div className="space-y-4">
      {/* Outer Card Wrapper */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">

        {/* Filter Toolbar */}
        <div className="flex w-full justify-between flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">

            {/* Gender Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Gender:</span>
              <div className="flex items-center gap-1">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGenderFilter(opt.value)}
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md transition-all ${genderFilter === opt.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(genderFilter !== "all" || searchTerm !== "") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setGenderFilter("all")
                  setSearchTerm("")
                }}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 h-8 px-3 rounded-lg"
              >
                Clear Filters
              </Button>
            )}
          </div>
          <Button onClick={() => router.push("/category/create")} className="bg-slate-900 hover:bg-black text-white font-bold text-xs h-9 px-4 rounded-md gap-2 shadow-xs cursor-pointer">
            <PlusIcon className="h-4 w-4" /> Add Collection
          </Button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-3 border-b border-slate-100 max-w-[500px]">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search all collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-14 text-sm font-medium text-slate-800 bg-[#f0f6fc] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-semibold text-slate-500 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-auto max-h-[calc(100vh-380px)] min-h-[350px] relative">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                <TableHead className="sticky top-0 z-20 bg-slate-50 w-12 h-11 text-[10px] font-bold text-slate-500 capitalize tracking-wider text-center border-b border-slate-200/80 shadow-2xs">
                  <input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 px-4 border-b border-slate-200/80 shadow-2xs">Name</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Slug</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Gender Target</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Type</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 text-center border-b border-slate-200/80 shadow-2xs">Status</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-50 h-11 text-xs font-semibold text-slate-600 text-right px-6 border-b border-slate-200/80 shadow-2xs">Action</TableHead>
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
                  let firstThumbnailUrl = ""
                  if (col.image_urls && col.image_urls.length > 0) {
                    firstThumbnailUrl = parseImageUrl(col.image_urls[0])
                  }

                  return (
                    <TableRow key={col.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors h-14">
                      <TableCell className="text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
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
                        <span className="text-[10px] font-bold capitalize tracking-wider rounded-md px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200/80">
                          {col.gender || "All"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs font-semibold text-slate-600 capitalize">
                          {col.type ? col.type.toLowerCase().replace('_', ' ') : 'Standard'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={!!col.is_show}
                            disabled={updateStatusMutation.isPending}
                            onCheckedChange={(checked) => {
                              updateStatusMutation.mutate({ id: col.id, is_show: checked })
                            }}
                          />
                          {col.is_show ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[9.5px] font-bold capitalize tracking-wide rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
                              <Globe className="h-2.5 w-2.5" /> Visible
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-500 border border-slate-200/80 text-[9.5px] font-bold capitalize tracking-wide rounded-full px-2.5 py-0.5">
                              Hidden
                            </span>
                          )}
                          {col.is_new_collection && (
                            <span className="bg-slate-100 text-slate-800 border border-slate-200/80 text-[9.5px] font-bold capitalize tracking-wide rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
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
