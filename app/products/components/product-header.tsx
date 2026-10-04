import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DownloadIcon, PlusIcon, RefreshCw } from "lucide-react"

interface ProductHeaderProps {
  onRefresh: () => void
  onExport: () => void
  isFetching?: boolean
}

export function ProductHeader({ onRefresh, onExport, isFetching }: ProductHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Products</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage product catalog, inventory, categories, and stock availability.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
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
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-8 text-xs font-medium"
        >
          <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />
          Export CSV
        </Button>
        <Link href="/products/create">
          <Button className="bg-slate-900 hover:bg-black text-white font-bold text-xs h-9 px-4 rounded-md shadow-xs cursor-pointer">
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Add Product
          </Button>
        </Link>
      </div>
    </div>
  )
}
