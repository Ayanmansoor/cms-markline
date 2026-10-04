"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { Trash2, FileText, Image as ImageIcon, ExternalLink, Search, Eye } from "lucide-react"
import { toast } from "sonner"

const getStatusBadge = (status: string) => {
  const s = (status || "PENDING").toUpperCase()
  switch (s) {
    case "APPROVE":
    case "APPROVED":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">Approved</Badge>
    case "ON HOLD":
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold">On Hold</Badge>
    case "COMPLETED":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold">Completed</Badge>
    case "REJECTED":
      return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">Rejected</Badge>
    case "CANCELED":
      return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-semibold">Cancelled</Badge>
    default:
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">Pending</Badge>
  }
}

export function ClaimsTable() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  // Fetch claims
  const { data: claimsResponse, isLoading, error } = useQuery({
    queryKey: ["helps-claims"],
    queryFn: async () => {
      const res = await fetch("/api/helps/claims")
      if (!res.ok) throw new Error("Failed to fetch claims")
      return res.json()
    }
  })

  const claims = claimsResponse?.claims || []

  const filteredClaims = useMemo(() => {
    if (!searchQuery.trim()) return claims
    const q = searchQuery.toLowerCase()
    return claims.filter((claim: any) => {
      const name = (claim.name || "").toLowerCase()
      const email = (claim.email || "").toLowerCase()
      const orderID = (claim.orderID || "").toLowerCase()
      const product = (claim.productname || "").toLowerCase()
      const desc = (claim.description || "").toLowerCase()
      return name.includes(q) || email.includes(q) || orderID.includes(q) || product.includes(q) || desc.includes(q)
    })
  }, [claims, searchQuery])

  // Delete Claim Mutation
  const deleteClaimMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/helps/claims/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete claim")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Claim record removed successfully!")
      queryClient.invalidateQueries({ queryKey: ["helps-claims"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete claim")
    }
  })

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200/80 rounded-xl shadow-2xs text-center">
      <FileText className="h-8 w-8 text-slate-300 mb-2" />
      <p className="text-slate-500 font-semibold text-xs">No claim inquiries found</p>
      <p className="text-slate-400 text-[11px] mt-0.5">
        {searchQuery ? "Try adjusting your search query." : "Product claim inquiries submitted by customers will appear here."}
      </p>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-medium text-muted-foreground">Loading claim inquiries...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-xs font-medium text-destructive">Failed to load claim inquiries.</div>
  }

  return (
    <div className="space-y-4">
      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, order, product..."
            className="pl-9 text-xs h-9 bg-white border-slate-200"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium self-end sm:self-center">
          Showing {filteredClaims.length} of {claims.length} claims
        </span>
      </div>

      {filteredClaims.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-320px)] min-h-[300px] relative">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 px-4 text-xs font-semibold text-slate-600 w-[160px] border-b border-slate-200/80 shadow-2xs">Customer</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 w-[150px] border-b border-slate-200/80 shadow-2xs">Order & Claim ID</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 w-[150px] border-b border-slate-200/80 shadow-2xs">Product</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 w-[110px] border-b border-slate-200/80 shadow-2xs">Status</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Reason / Description</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 w-[160px] border-b border-slate-200/80 shadow-2xs">Media</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 text-right px-4 w-[110px] border-b border-slate-200/80 shadow-2xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim: any) => (
                  <TableRow 
                    key={claim.id} 
                    onClick={() => router.push(`/helps/claims/${claim.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    {/* Customer Column */}
                    <TableCell className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-900 block">{claim.name}</span>
                        <span className="text-[10px] font-medium text-muted-foreground block">{claim.email}</span>
                      </div>
                    </TableCell>

                    {/* Order & Claim UUID Column */}
                    <TableCell className="py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground capitalize">Order:</span>
                          <span className="text-[11px] font-mono font-semibold text-slate-700 block max-w-[90px] truncate">{claim.orderID || 'N/A'}</span>
                        </div>
                        {claim.claim_id && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-medium text-muted-foreground capitalize">Claim ID:</span>
                            <span className="text-[10px] font-mono text-slate-500 block max-w-[90px] truncate">{claim.claim_id}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Product Column */}
                    <TableCell className="py-3.5">
                      <span className="text-xs font-medium text-slate-900 block max-w-[140px] truncate">{claim.productname}</span>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell className="py-3.5">
                      {getStatusBadge(claim.status)}
                    </TableCell>

                    {/* Description Column */}
                    <TableCell className="py-3.5">
                      <span className="text-xs text-slate-600 block max-w-[260px] line-clamp-2 leading-relaxed">
                        {claim.description}
                      </span>
                    </TableCell>

                    {/* Media Images Grid Column */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {claim.media_urls && claim.media_urls.length > 0 ? (
                          claim.media_urls.map((url: string, index: number) => (
                            <div 
                              key={index} 
                              className="group relative w-9 h-9 rounded border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs hover:border-blue-500 transition-all shrink-0"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`media-${index}`} className="w-full h-full object-cover" />
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5" /> No media
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/helps/claims/${claim.id}`)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteClaimMutation.isPending}
                          onClick={() => setDeleteTarget({ id: claim.id, name: claim.name })}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Delete Claim"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteClaimMutation.mutate(deleteTarget.id)}
        itemName={deleteTarget ? `Claim from ${deleteTarget.name}` : undefined}
        isPending={deleteClaimMutation.isPending}
      />
    </div>
  )
}

