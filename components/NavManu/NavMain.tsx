"use client"

import { usePathname } from "next/navigation"
import {
    ChevronRight,
    LucideIcon,
} from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"


type NavItem = {
    title: string;
    href: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        href: string;
    }[];
};

export function NavMain({
    items,
}: {
    items: NavItem[]
}) {
    const pathname = usePathname()

    const checkActive = (targetHref: string) => {
        if (!targetHref || targetHref === "#") return false
        if (targetHref.includes("?")) {
            const [path, search] = targetHref.split("?")
            const currentSearch = typeof window !== "undefined" ? window.location.search : ""
            if (pathname === path) {
                if (!currentSearch) {
                    return search.includes("tab=collections") || search.includes("tab=banners")
                }
                return currentSearch.includes(search)
            }
            return false
        }
        return pathname === targetHref
    }

    const isItemActive = (item: NavItem) => {
        if (checkActive(item.href)) return true
        if (item.items) {
            return item.items.some(sub => checkActive(sub.href))
        }
        return false
    }

    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const active = isItemActive(item)
                        return item.items ? (
                            <Collapsible
                                key={item.title}
                                defaultOpen={item.isActive || active}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton 
                                            tooltip={item.title}
                                            isActive={active}
                                            className="text-slate-600 hover:!text-slate-900 hover:!bg-slate-100/80 data-[active=true]:!text-white data-[active=true]:!bg-black data-[active=true]:!font-bold font-medium rounded-lg transition-colors"
                                        >
                                            {item.icon && <item.icon className="!size-5" />}
                                            <span className="ml-2">{item.title}</span>

                                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items.map((sub) => {
                                                const isSubActive = checkActive(sub.href)
                                                return (
                                                    <SidebarMenuSubItem key={sub.title}>
                                                        <SidebarMenuSubButton 
                                                            asChild
                                                            isActive={isSubActive}
                                                            className="text-slate-600 hover:!text-slate-900 hover:!bg-slate-100/80 data-[active=true]:!text-white data-[active=true]:!bg-black data-[active=true]:!font-bold font-medium rounded-lg transition-colors"
                                                        >
                                                            <a href={sub.href}>
                                                                <span className="ml-2">{sub.title}</span>
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                )
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ) : (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton 
                                    asChild
                                    isActive={active}
                                    className="text-slate-600 hover:!text-slate-900 hover:!bg-slate-100/80 data-[active=true]:!text-white data-[active=true]:!bg-black data-[active=true]:!font-bold font-medium rounded-lg transition-colors"
                                >
                                    <a href={item.href}>
                                        {item.icon && <item.icon className="!size-5" />}
                                        <span className="ml-2">{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}