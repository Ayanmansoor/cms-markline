import React from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, RefreshCw, PlusIcon } from "lucide-react"

interface CategoryBannerHeaderProps {
  onRefresh: () => void
  onAddOpen: () => void
  isFetching?: boolean
}

export function CategoryBannerHeader({ onRefresh, onAddOpen, isFetching }: CategoryBannerHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-slate-900" />
          Category Banners & Hero Media
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Manage collection hero banners, promotional posters, and mobile visual slides.
        </p>
      </div>

    </div>
  )
}
