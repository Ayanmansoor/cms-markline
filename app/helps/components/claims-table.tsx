"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, FileText, Image, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export function ClaimsTable() {
  const router = useRouter()
  const queryClient = useQueryClient()

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
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete claim")
    }
  })

  const handleDeleteClaim = (id: number, name: string) => {
    if (confirm(`Are you sure you want to remove the claim by "${name}"?`)) {
      deleteClaimMutation.mutate(id)
    }
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
      <FileText className="h-6 w-6 text-slate-300 mb-2" />
      <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">data is not present</p>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-8 text-xs font-semibold text-slate-400">Loading claims list...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-xs font-semibold text-red-500">Failed to load claims.</div>
  }

  if (claims.length === 0) {
    return renderEmptyState()
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f4f7fb] border-b border-slate-200/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[160px]">Customer</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[150px]">Order & Claim ID</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[160px]">Product Name</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason / Description</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[180px]">Attached Media</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim: any) => (
            <TableRow 
              key={claim.id} 
              onClick={() => router.push(`/helps/claims/${claim.id}`)}
              className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer"
            >
              {/* Customer Column */}
              <TableCell className="px-6 py-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">{claim.name}</span>
                  <span className="text-[10px] font-semibold text-slate-400 block">{claim.email}</span>
                </div>
              </TableCell>

              {/* Order & Claim UUID Column */}
              <TableCell className="py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Order ID:</span>
                    <span className="text-[11px] font-mono font-bold text-slate-700 block max-w-[80px] truncate">{claim.orderID || 'N/A'}</span>
                  </div>
                  {claim.claim_id && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Claim UUID:</span>
                      <span className="text-[10px] font-mono text-slate-500 block max-w-[80px] truncate">{claim.claim_id}</span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Product Column */}
              <TableCell className="py-4">
                <span className="text-xs font-bold text-slate-900 block max-w-[150px] truncate">{claim.productname}</span>
              </TableCell>

              {/* Description Column */}
              <TableCell className="py-4">
                <span className="text-xs font-medium text-slate-700 block max-w-[280px] line-clamp-3 leading-relaxed">
                  {claim.description}
                </span>
              </TableCell>

              {/* Media Images Grid Column */}
              <TableCell className="py-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {claim.media_urls && claim.media_urls.length > 0 ? (
                    claim.media_urls.map((url: string, index: number) => (
                      <div 
                        key={index} 
                        className="group relative w-10 h-10 rounded border border-slate-200 bg-slate-50 overflow-hidden shadow-xs hover:border-blue-500 transition-all shrink-0"
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
                    <span className="text-[11px] font-medium text-slate-400 italic flex items-center gap-1">
                      <Image className="h-3.5 w-3.5" /> No attachments
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Actions Column */}
              <TableCell className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                <Button
                  disabled={deleteClaimMutation.isPending}
                  onClick={() => handleDeleteClaim(claim.id, claim.name)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
