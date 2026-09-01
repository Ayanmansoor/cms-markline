"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Folder, ImageIcon, PlusIcon } from "lucide-react"

export function CategoryNavTabs() {
  const pathname = usePathname()

  const tabs = [
    { name: "Collections", href: "/category", icon: Folder },
    { name: "Banners", href: "/category/banner", icon: ImageIcon },
    { name: "Create Collection", href: "/category/create", icon: PlusIcon },
  ]

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs inline-flex items-center gap-1.5 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 select-none ${
              isActive
                ? "bg-emerald-600 !text-white font-bold shadow-xs hover:bg-emerald-700"
                : "text-slate-600 hover:!text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "!text-white" : "text-slate-400"}`} />
            <span>{tab.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
