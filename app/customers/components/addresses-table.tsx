"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MapPinIcon } from "lucide-react"

export function AddressesTable() {
  const { data: addressesData, isLoading, error } = useQuery({
    queryKey: ["global-addresses"],
    queryFn: async () => {
      const res = await fetch("/api/customers/addresses")
      if (!res.ok) throw new Error("Failed to fetch addresses")
      return res.json()
    }
  })

  const addresses = addressesData?.addresses || []

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
      <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">data is not present</p>
    </div>
  )

  if (isLoading) {
    return <div className="text-center py-8 text-xs font-semibold text-slate-400">Loading addresses...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-xs font-semibold text-red-500">Failed to load addresses.</div>
  }

  if (addresses.length === 0) {
    return renderEmptyState()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="h-11 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Label</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recipient</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Address</TableHead>
            <TableHead className="h-11 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location / Zip Code</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {addresses.map((addr: any) => (
            <TableRow key={addr.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <TableCell className="px-6 py-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">{addr.customerName}</span>
                  <span className="text-[10px] font-semibold text-slate-400 block">{addr.customerEmail}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-900">{addr.name || 'Address'}</span>
                  {addr.is_selected === 'true' && (
                    <Badge variant="secondary" className="ml-2 text-[8px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Selected</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">{addr.recipientName || 'N/A'}</span>
                  {addr.recipientPhone && (
                    <span className="text-[10px] font-semibold text-slate-400 block">{addr.recipientPhone}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-4">
                <span className="text-xs font-medium text-slate-705 block max-w-[250px] line-clamp-2">{addr.full_address}</span>
              </TableCell>
              <TableCell className="py-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-slate-650 block">
                    {addr.city && `${addr.city}, `}{addr.state_name || 'N/A'}
                  </span>
                  {addr.pin_code && (
                    <span className="text-[10px] font-mono font-semibold text-slate-400 block">ZIP: {addr.pin_code}</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
