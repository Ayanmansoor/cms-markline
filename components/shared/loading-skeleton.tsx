import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  rows?: number
  columns?: number
}

export function TableLoadingSkeleton({ rows = 5, columns = 4 }: LoadingSkeletonProps) {
  return (
    <div className="w-full space-y-3 p-4 border rounded-xl bg-card">
      <div className="flex justify-between items-center pb-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center space-x-4 py-2">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <Skeleton key={cIdx} className="h-6 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
