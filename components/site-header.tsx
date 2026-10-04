"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { BellIcon, ShieldCheck, Mail, LogOut, ShoppingBag, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbItemType {
  label: string
  href?: string
}

interface SiteHeaderProps {
  title?: string
  breadcrumbs?: BreadcrumbItemType[]
}

const defaultRouteConfigs: Record<string, { title: string; breadcrumbs: BreadcrumbItemType[] }> = {
  "/": { title: "Dashboard", breadcrumbs: [{ label: "Overview" }, { label: "Dashboard" }] },
  "/category": { title: "Collections", breadcrumbs: [{ label: "Catalog", href: "/category" }, { label: "Collections" }] },
  "/category/banner": { title: "Collection Banners", breadcrumbs: [{ label: "Catalog", href: "/category" }, { label: "Banners" }] },
  "/brands": { title: "Brand Directory", breadcrumbs: [{ label: "Catalog", href: "/category" }, { label: "Brands" }] },
  "/products": { title: "Products", breadcrumbs: [{ label: "Catalog", href: "/category" }, { label: "Products" }] },
  "/orders": { title: "Orders", breadcrumbs: [{ label: "Sales", href: "/orders" }, { label: "Orders" }] },
  "/shipments": { title: "Shipments", breadcrumbs: [{ label: "Sales", href: "/orders" }, { label: "Shipments" }] },
  "/return": { title: "Return Shipments", breadcrumbs: [{ label: "Sales", href: "/orders" }, { label: "Return Shipments" }] },
  "/customers": { title: "Customers", breadcrumbs: [{ label: "Directory" }, { label: "Customers" }] },
  "/discounts": { title: "Discounts", breadcrumbs: [{ label: "Promotions" }, { label: "Discounts" }] },
  "/coupon": { title: "Coupons", breadcrumbs: [{ label: "Promotions" }, { label: "Coupons" }] },
  "/blogs": { title: "Blogs", breadcrumbs: [{ label: "Content" }, { label: "Blogs" }] },
  "/helps": { title: "Help Center", breadcrumbs: [{ label: "Support" }, { label: "Helps" }] },
  "/banners": { title: "Banners & Media", breadcrumbs: [{ label: "Marketing" }, { label: "Banners" }] },
  "/marketing/notifications": { title: "Push Notifications", breadcrumbs: [{ label: "Marketing" }, { label: "Notifications" }] },
  "/marketing/broadcasting": { title: "Broadcasting", breadcrumbs: [{ label: "Marketing" }, { label: "Broadcasting" }] },
}

export function SiteHeader({ title, breadcrumbs }: SiteHeaderProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user

  // Extract name and fallback values
  const userEmail = user?.email || "admin@markline.com"
  const userName = user?.name || userEmail.split('@')[0] || "Admin"
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || "AD"

  // Determine title and breadcrumbs dynamically from props or route
  const routeConfig = defaultRouteConfigs[pathname]
  const displayTitle = title || routeConfig?.title || "Overview"
  const displayBreadcrumbs = breadcrumbs || routeConfig?.breadcrumbs || [{ label: "Home" }, { label: displayTitle }]

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 px-8 bg-white dark:bg-slate-950 dark:border-slate-800">
      {/* Title & Shadcn Breadcrumb Header Section */}
      <div className="flex flex-col justify-center">
        <h1 className="text-xl font-bold tracking-tight text-[#0f172a] dark:text-slate-100">
          {displayTitle}
        </h1>
        <Breadcrumb className="mt-0.5">
          <BreadcrumbList className="text-xs font-medium text-slate-500">
            {displayBreadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <BreadcrumbSeparator className="[&>svg]:size-3" />}
                <BreadcrumbItem>
                  {b.href ? (
                    <BreadcrumbLink href={b.href} className="hover:text-slate-900 dark:hover:text-slate-100">
                      {b.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="font-semibold text-slate-900 dark:text-slate-100">
                      {b.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 relative transition-colors cursor-pointer focus:outline-none">
              <BellIcon className="h-[22px] w-[22px]" />
              <span className="absolute -top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-950"></span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 rounded-xl p-2 shadow-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900" align="end" sideOffset={10}>
            <DropdownMenuLabel className="font-bold px-2 py-2 flex items-center justify-between text-slate-900 dark:text-slate-100">
              <span>Notifications</span>
              <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                3 New
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-850" />
            
            <div className="flex flex-col gap-1 py-1">
              {/* Notification 1 */}
              <DropdownMenuItem className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    New Order #ORD-8492
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    ₹1,249.00 • 2 mins ago
                  </p>
                </div>
              </DropdownMenuItem>

              {/* Notification 2 */}
              <DropdownMenuItem className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Low Stock Alert
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Premium T-Shirt (Size M) • 1 hr ago
                  </p>
                </div>
              </DropdownMenuItem>

              {/* Notification 3 */}
              <DropdownMenuItem className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Database Sync Complete
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Auto-backup executed • 5 hrs ago
                  </p>
                </div>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-850" />
            <DropdownMenuItem 
              asChild
              className="w-full text-center py-2 text-xs font-bold text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <a href="/marketing/notifications">
                <span>Show More Notifications</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User Profile Dropdown / Popover Card */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 ml-2 hover:opacity-85 focus:outline-none cursor-pointer">
              <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-sm transition-transform duration-200 hover:scale-105">
                <AvatarImage src={user?.image || ""} alt={userName} />
                <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block font-bold text-slate-900 dark:text-slate-100">
                {userName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 rounded-xl p-2 shadow-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900" align="end" sideOffset={10}>
            <DropdownMenuLabel className="font-normal px-2 py-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-850" />
            <DropdownMenuGroup className="py-1">
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Role: Administrator</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>Session: Active (OTP)</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-850" />
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
