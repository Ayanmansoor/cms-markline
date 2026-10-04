import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw, Tag } from "lucide-react"

interface BrandHeaderProps {
  onRefresh: () => void
  isFetching?: boolean
}

export function BrandHeader({ onRefresh, isFetching }: BrandHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Brand Directory
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage brand catalog, segments, assigned products, and discounts.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-8 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Link href="/brands/create">
          <Button size="sm" className="h-8 text-xs font-medium">
            <PlusIcon className="w-3.5 h-3.5 mr-1.5" />
            Add Brand
          </Button>
        </Link>
      </div>
    </div>
  )
}
