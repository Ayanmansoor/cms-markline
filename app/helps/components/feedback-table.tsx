"use client"

import React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, MessageSquare } from "lucide-react"
import { toast } from "sonner"

export function FeedbackTable() {
  const queryClient = useQueryClient()

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
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete feedback")
    }
  })

  const handleDeleteFeedback = (id: number) => {
    if (confirm("Are you sure you want to remove this feedback?")) {
      deleteFeedbackMutation.mutate(id)
    }
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
      <MessageSquare className="h-6 w-6 text-slate-300 mb-2" />
      <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">data is not present</p>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-8 text-xs font-semibold text-slate-400">Loading feedback list...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-xs font-semibold text-red-500">Failed to load feedback.</div>
  }

  if (feedback.length === 0) {
    return renderEmptyState()
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
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f4f7fb] border-b border-slate-200/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[80px]">ID</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Feedback Message</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[250px]">Topics / Points Interested</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[160px]">Submitted On</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-6 w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedback.map((item: any) => {
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'

            return (
              <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <TableCell className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-800">#{item.id}</span>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-xs font-medium text-slate-700 block max-w-lg leading-relaxed whitespace-pre-line">
                    {item.message}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.point && item.point.length > 0 ? (
                      item.point.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className={`text-[9px] font-bold uppercase tracking-wider rounded px-2 py-0.5 whitespace-nowrap ${getTagBadgeStyle(tag)}`}>
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">None specified</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 text-xs font-semibold text-slate-505">
                  {dateStr}
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <Button
                    disabled={deleteFeedbackMutation.isPending}
                    onClick={() => handleDeleteFeedback(item.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-655 hover:bg-red-50 rounded-lg transition-colors"
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
  )
}
