import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw, Folder } from "lucide-react"

interface CategoryHeaderProps {
  onRefresh: () => void
  isFetching?: boolean
}

export function CategoryHeader({ onRefresh, isFetching }: CategoryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
          <Folder className="w-6 h-6 text-slate-900" />
          Categories & Collections
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Organize product taxonomy, catalog categories, and seasonal collections.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs h-9 px-3.5 rounded-md cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-slate-500 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Link href="/category/create">
          <Button className="bg-slate-900 hover:bg-black text-white font-bold text-xs h-9 px-4 rounded-md shadow-xs cursor-pointer">
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Create Collection
          </Button>
        </Link>
      </div>
    </div>
  )
}
