"use client"

import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteCampaignDialogProps {
  campaignId: number | null
  onClose: () => void
}

export function DeleteCampaignDialog({ campaignId, onClose }: DeleteCampaignDialogProps) {
  const queryClient = useQueryClient()

  // Mutation for deleting campaign
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/marketing/broadcasting/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete campaign")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Email campaign deleted successfully!")
      onClose()
      queryClient.invalidateQueries({ queryKey: ["emailCampaigns"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  return (
    <Dialog
      open={campaignId !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[420px] bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" /> Delete Email Campaign
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Are you sure you want to delete email campaign #{campaignId}? This will remove all
            recipient delivery tracking entries permanently.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 border-t border-slate-100 pt-4 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold border-slate-200 text-slate-600 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => campaignId && deleteMutation.mutate(campaignId)}
            className="text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 mr-2" />
            )}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
