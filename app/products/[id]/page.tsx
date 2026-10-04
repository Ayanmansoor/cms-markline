"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ProductUpdateForm } from "../components/product-update-form"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"
import { toast } from "sonner"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  const [initialData, setInitialData] = useState<any>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return
      try {
        setFetching(true)
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error("Failed to fetch product")
        const data = await res.json()
        setInitialData(data.product)
      } catch (err: any) {
        toast.error(err.message || "Failed to load product details")
      } finally {
        setFetching(false)
      }
    }
    fetchProduct()
  }, [productId])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto p-8 pt-6">
          {fetching ? (
            <TableLoadingSkeleton rows={5} columns={4} />
          ) : initialData ? (
            <ProductUpdateForm productId={productId} initialData={initialData} />
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm font-semibold">
              Product not found.
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
