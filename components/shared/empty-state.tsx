import React from "react"
import { PackageOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  title = "No items found",
  description = "There are no records to display at the moment.",
  icon = <PackageOpen className="w-10 h-10 text-muted-foreground/60" />,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-xl bg-card text-card-foreground">
      <div className="p-3 bg-muted/50 rounded-full mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="text-xs font-medium">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
