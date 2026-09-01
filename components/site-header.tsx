"use client"

import { SearchIcon, BellIcon, ShieldCheck, Mail, LogOut, ShoppingBag, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
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

export function SiteHeader() {
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

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 px-8 bg-white dark:bg-slate-950 dark:border-slate-800">
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search product or order..." 
            className="w-full bg-[#f4f7fb] dark:bg-slate-900 pl-9 rounded-lg border-transparent focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 shadow-none h-10 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </div>
      <div className="flex items-center gap-8 text-sm font-bold">
        <nav className="hidden md:flex items-center gap-8 text-slate-500 dark:text-slate-400">
          <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Inventory</a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Orders</a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Analytics</a>
        </nav>
        <div className="flex items-center gap-4">
          <ModeToggle />
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
      </div>
    </header>
  )
}
