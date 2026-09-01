import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  itemName?: string
  isPending?: boolean
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  isPending = false
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1.5">
            {itemName ? (
              <>
                Are you sure you want to delete <span className="font-semibold text-slate-900">"{itemName}"</span>? {description}
              </>
            ) : (
              description
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isPending ? "Deleting..." : "Delete Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
