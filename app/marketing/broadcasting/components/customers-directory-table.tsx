"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Loader2, Users, Mail, Phone, Send } from "lucide-react"

interface CustomersDirectoryTableProps {
  customers: any[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onClearSearch: () => void
  onTargetCustomer: (customerId: string) => void
}

export function CustomersDirectoryTable({
  customers,
  isLoading,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onTargetCustomer
}: CustomersDirectoryTableProps) {
  return (
    <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer by name, email, or phone..."
            className="pl-9 text-xs border-slate-200 bg-slate-50/50 !text-black h-9"
          />
        </div>
        {searchQuery && (
          <Button
            onClick={onClearSearch}
            variant="ghost"
            className="text-xs font-bold text-red-600 hover:text-red-700 h-9 cursor-pointer"
          >
            Clear Search
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading customers directory...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="py-24 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">No customers found matching search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Customer Name
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Email Address
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Phone Number
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4 text-right">
                  Quick Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((cust: any) => (
                <TableRow
                  key={cust.id}
                  className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors"
                >
                  <TableCell className="py-3.5 font-bold text-xs text-slate-900 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                      {cust.name ? cust.name.slice(0, 2) : "CU"}
                    </div>
                    {cust.name}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {cust.email}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {cust.phone || "N/A"}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 text-right">
                    <Button
                      onClick={() => onTargetCustomer(cust.id || cust.email)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-bold border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                    >
                      <Send className="h-3 w-3 mr-1.5" /> Target Email
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}
