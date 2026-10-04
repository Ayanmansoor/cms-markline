"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, PackageIcon, MegaphoneIcon, ShoppingCartIcon, FileTextIcon, SettingsIcon, LifeBuoyIcon, PlusIcon, ServerIcon, TagsIcon, UsersIcon, PercentIcon, LayersIcon, Folder, Ticket } from "lucide-react"
import { Button } from "./ui/button"
import { NavMain } from "./NavManu/NavMain"

const navMain =
  [
    { title: "Dashboard", href: "/", icon: LayoutDashboardIcon },
    { title: "Products", href: "/products", icon: PackageIcon },
    {
      title: "Categories & Banner",
      href: "#",
      icon: Folder,
      isActive: true,
      items: [
        {
          title: "All Collections",
          href: "/category",
        },
        {
          title: "Collection Banners",
          href: "/category/banner",
        },
      ],
    },
    { title: "Brands", href: "/brands", icon: TagsIcon },
    { title: "Customers", href: "/customers", icon: UsersIcon },
    { title: "Discounts", href: "/discounts", icon: PercentIcon },
    { title: "Coupons", href: "/coupon", icon: Ticket },
    {
      title: "Banner & Video",
      href: "#",
      icon: MegaphoneIcon,
      isActive: true,
      items: [
        {
          title: "Banner",
          href: "/banners?tab=banners",
        },
        {
          title: "Video",
          href: "/banners?tab=videos",
        },
      ],
    },
    {
      title: "Orders",
      href: "#",
      icon: ShoppingCartIcon,
      isActive: true, // keeps it expanded
      items: [
        {
          title: "All Orders",
          href: "/orders",
        },
        {
          title: "All Shipments",
          href: "/shipments",
        },
        {
          title: "All Return",
          href: "/return",
        },
      ],
    },
    {
      title: "Marketing",
      href: "#",
      icon: MegaphoneIcon,
      isActive: true,
      items: [
        {
          title: "Push Notifications",
          href: "/marketing/notifications",
        },
        {
          title: "Customer Broadcasting",
          href: "/marketing/broadcasting",
        },
      ],
    },
    { title: "Blogs", href: "/blogs", icon: FileTextIcon },
    { title: "Helps", href: "/helps", icon: LifeBuoyIcon },
  ]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const activeTab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;

  return (
    <Sidebar className="border-r border-slate-200 bg-white" {...props}>
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-slate-50 hover:text-slate-900 bg-white">
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white shadow-sm">
                  <ServerIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none ml-2">
                  <span className="font-bold text-base text-[#0f172a]">Markline</span>
                  <span className="text-xs text-slate-500 font-medium">Enterprise Admin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter className="p-4 flex flex-col gap-4 bg-white">

        <SidebarMenu className="px-1 gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/settings" && activeTab !== "product-groups"}
              asChild
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-50 data-[active=true]:!text-white data-[active=true]:!bg-black data-[active=true]:!font-bold font-medium rounded-lg"
            >
              <a href="/settings">
                <SettingsIcon className="!size-5" />
                <span className="ml-2">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/helps"}
              asChild
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-50 data-[active=true]:!text-white data-[active=true]:!bg-black data-[active=true]:!font-bold font-medium rounded-lg"
            >
              <a href="/helps">
                <LifeBuoyIcon className="!size-5" />
                <span className="ml-2">Support (Helps)</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
