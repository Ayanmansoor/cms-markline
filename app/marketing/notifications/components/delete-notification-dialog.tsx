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

interface DeleteNotificationDialogProps {
  notificationId: number | null
  onClose: () => void
}

export function DeleteNotificationDialog({
  notificationId,
  onClose
}: DeleteNotificationDialogProps) {
  const queryClient = useQueryClient()

  // Mutation to delete notification
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/marketing/notifications/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete notification")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Notification deleted successfully!")
      onClose()
      queryClient.invalidateQueries({ queryKey: ["notificationsLog"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  return (
    <Dialog
      open={notificationId !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[420px] bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" /> Delete Notification
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Are you sure you want to delete notification #{notificationId}? This will remove all
            associated recipient logs permanently.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 border-t border-slate-100 pt-4 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold border-slate-200 text-slate-600"
          >
            Cancel
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => notificationId && deleteMutation.mutate(notificationId)}
            className="text-xs font-bold bg-red-600 text-white hover:bg-red-700"
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
