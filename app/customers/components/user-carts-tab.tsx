"use client"

import React from "react"
import { useMutation } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ShoppingCartIcon, Mail } from "lucide-react"
import { toast } from "sonner"

interface UserCartsTabProps {
  carts: any[]
  formatCurrency: (val: number) => string
  renderEmptyState: () => React.ReactNode
}

export function UserCartsTab({ carts, formatCurrency, renderEmptyState }: UserCartsTabProps) {
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

  if (carts.length === 0) return <>{renderEmptyState()}</>

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="h-11 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cart Item ID</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Added Date</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Quantity</TableHead>
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
                <span className="text-xs font-semibold text-slate-605">
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
                    <span className="text-xs font-bold text-slate-900 block">{cart.product_name || `Product ID: ${cart.product_id}`}</span>
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
                <span className="text-xs font-semibold text-slate-700">{cart.quantity || 1}</span>
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
                  className="h-7 text-[10px] font-bold border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 !text-blue-500 transition-all gap-1.5"
                >
                  <Mail className="h-3 w-3" /> Remind Checkout
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
