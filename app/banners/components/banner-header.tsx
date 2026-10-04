import React from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, PlusIcon } from "lucide-react"

interface BannerHeaderProps {
  activeTab: string
  onTabChange: (val: string) => void
  onAddOpen: () => void
}

export function BannerHeader({ activeTab, onTabChange, onAddOpen }: BannerHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Banners & Visual Media
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage promotional store hero banners, mobile slides, and video reels.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === "banners" ? "default" : "outline"}
          size="sm"
          onClick={() => onTabChange("banners")}
          className="h-8 text-xs font-medium"
        >
          Banners
        </Button>
        <Button
          variant={activeTab === "videos" ? "default" : "outline"}
          size="sm"
          onClick={() => onTabChange("videos")}
          className="h-8 text-xs font-medium"
        >
          Shop Videos
        </Button>
      </div>
    </div>
  )
}
