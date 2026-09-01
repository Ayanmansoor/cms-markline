"use client"

import React from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ShoppingCartIcon, Mail } from "lucide-react"
import { toast } from "sonner"

export function CartsTable() {
  const { data: cartsData, isLoading, error } = useQuery({
    queryKey: ["global-carts"],
    queryFn: async () => {
      const res = await fetch("/api/customers/carts")
      if (!res.ok) throw new Error("Failed to fetch carts")
      return res.json()
    }
  })

  const carts = cartsData?.carts || []

  // Individual notify mutation
  const notifyMutation = useMutation({
    mutationFn: async (cartId: number) => {
      const res = await fetch("/api/customers/carts/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to trigger email notification")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Checkout reminder email sent successfully!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send email notification")
    }
  })

  // Bulk notify mutation
  const bulkNotifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/customers/carts/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to trigger bulk email notifications")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Bulk checkout reminders sent successfully!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send bulk email notifications")
    }
  })

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
      <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">data is not present</p>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-8 text-xs font-semibold text-slate-400">Loading active carts...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-xs font-semibold text-red-500">Failed to load active carts.</div>
  }

  if (carts.length === 0) {
    return renderEmptyState()
  }

  return (
    <div className="space-y-4">
      {/* Carts Tab Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Active Customer Carts</h3>
          <p className="text-xs text-slate-500">Track and remind customers about items left in their shopping cart.</p>
        </div>
        <Button
          onClick={() => bulkNotifyMutation.mutate()}
          disabled={bulkNotifyMutation.isPending || carts.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 gap-2"
        >
          <Mail className="h-3.5 w-3.5" /> Notify All Checkout
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="h-11 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cart ID</TableHead>
              <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</TableHead>
              <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Updated</TableHead>
              <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Details</TableHead>
              <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Qty</TableHead>
              <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-6">Price</TableHead>
              <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carts.map((cart: any) => (
              <TableRow key={cart.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCartIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-900">#{cart.id}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">{cart.customerName}</span>
                    <span className="text-[10px] font-semibold text-slate-400 block">{cart.customerEmail}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-xs font-semibold text-slate-650">
                    {new Date(cart.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit'
                    })}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    {cart.image_url && (
                      <div className="h-9 w-9 border border-slate-200 rounded-md overflow-hidden bg-slate-50 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cart.image_url} alt={cart.product_name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">{cart.product_name || `Product: ${cart.product_id}`}</span>
                      {(cart.selected_color_name || cart.selected_size) && (
                        <span className="text-[10px] font-semibold text-slate-400 block capitalize">
                          {cart.selected_color_name}
                          {cart.selected_size && ` • Size ${cart.selected_size} ${cart.selected_size_unit || ''}`}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-center">
                  <span className="text-xs font-bold text-slate-700">{cart.quantity || 1}</span>
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <span className="text-xs font-black text-slate-900">{formatCurrency(cart.variant_price || 0)}</span>
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <Button
                    onClick={() => notifyMutation.mutate(cart.id)}
                    disabled={notifyMutation.isPending}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-bold border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all gap-1.5"
                  >
                    <Mail className="h-3 w-3" /> Remind Checkout
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
