"use client"

import React, { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { Trash2, MessageSquare, Search } from "lucide-react"
import { toast } from "sonner"

export function FeedbackTable() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  // Fetch feedback
  const { data: feedbackResponse, isLoading, error } = useQuery({
    queryKey: ["helps-feedback"],
    queryFn: async () => {
      const res = await fetch("/api/helps/feedback")
      if (!res.ok) throw new Error("Failed to fetch feedback")
      return res.json()
    }
  })

  const feedback = feedbackResponse?.feedback || []

  const filteredFeedback = useMemo(() => {
    if (!searchQuery.trim()) return feedback
    const q = searchQuery.toLowerCase()
    return feedback.filter((item: any) => {
      const msg = (item.message || "").toLowerCase()
      const points = Array.isArray(item.point) ? item.point.join(" ").toLowerCase() : ""
      return msg.includes(q) || points.includes(q)
    })
  }, [feedback, searchQuery])

  // Delete Feedback Mutation
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/helps/feedback/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete feedback")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Feedback record removed successfully!")
      queryClient.invalidateQueries({ queryKey: ["helps-feedback"] })
      setDeleteTargetId(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete feedback")
    }
  })

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200/80 rounded-xl shadow-2xs text-center">
      <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
      <p className="text-slate-500 font-semibold text-xs">No user feedback found</p>
      <p className="text-slate-400 text-[11px] mt-0.5">
        {searchQuery ? "Try adjusting your search query." : "Storefront feedback submissions will appear here."}
      </p>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-medium text-muted-foreground">Loading feedback list...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-xs font-medium text-destructive">Failed to load feedback.</div>
  }

  // Tags badge styling map
  const getTagBadgeStyle = (tag: string) => {
    const t = tag.toLowerCase()
    if (t === 'payment') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (t === 'delivery') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (t === 'products') return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    if (t === 'category') return 'bg-violet-50 text-violet-700 border-violet-200'
    return 'bg-slate-50 text-slate-600 border-slate-200'
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
            placeholder="Search feedback message or topics..."
            className="pl-9 text-xs h-9 bg-white border-slate-200"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium self-end sm:self-center">
          Showing {filteredFeedback.length} of {feedback.length} feedback entries
        </span>
      </div>

      {filteredFeedback.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-320px)] min-h-[300px] relative">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 px-4 text-xs font-semibold text-slate-600 w-[80px] border-b border-slate-200/80 shadow-2xs">ID</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 border-b border-slate-200/80 shadow-2xs">Feedback Message</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 w-[240px] border-b border-slate-200/80 shadow-2xs">Topics / Points Interested</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 w-[160px] border-b border-slate-200/80 shadow-2xs">Submitted On</TableHead>
                  <TableHead className="sticky top-0 z-20 bg-slate-50 h-10 text-xs font-semibold text-slate-600 text-right px-4 w-[80px] border-b border-slate-200/80 shadow-2xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.map((item: any) => {
                  const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'

                  return (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <TableCell className="px-4 py-3.5">
                        <span className="text-xs font-bold text-slate-800">#{item.id}</span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-xs text-slate-700 block max-w-lg leading-relaxed whitespace-pre-line">
                          {item.message}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.point && item.point.length > 0 ? (
                            item.point.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="outline" className={`text-[9px] font-semibold capitalize tracking-wider rounded px-2 py-0.5 whitespace-nowrap ${getTagBadgeStyle(tag)}`}>
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None specified</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-slate-500 font-medium">
                        {dateStr}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteFeedbackMutation.isPending}
                          onClick={() => setDeleteTargetId(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Delete Feedback"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => deleteTargetId && deleteFeedbackMutation.mutate(deleteTargetId)}
        itemName={deleteTargetId ? `Feedback #${deleteTargetId}` : undefined}
        isPending={deleteFeedbackMutation.isPending}
      />
    </div>
  )
}

