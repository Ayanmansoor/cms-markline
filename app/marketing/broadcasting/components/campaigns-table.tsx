"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Megaphone, Users, Trash2, Clock } from "lucide-react"
import { EmailCampaignItem } from "./types"

interface CampaignsTableProps {
  campaigns: EmailCampaignItem[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onClearSearch: () => void
  onSelectRecipients: (campaign: EmailCampaignItem) => void
  onDelete: (id: number) => void
}

export function CampaignsTable({
  campaigns,
  isLoading,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onSelectRecipients,
  onDelete
}: CampaignsTableProps) {
  const renderStatusBadge = (status: EmailCampaignItem["status"]) => {
    const s = (status || "").toString().toLowerCase()
    if (s === "sent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Sent
        </span>
      )
    }
    if (s === "scheduled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 text-amber-500" />
          Scheduled
        </span>
      )
    }
    if (s === "failed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
          Failed
        </span>
      )
    }
    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search email subject or content..."
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
          <p className="text-xs font-semibold text-slate-500">Loading email campaigns log...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-24 text-center">
          <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">No email campaigns found in database.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Subject & Banner
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Audience
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Sent / Reach
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Failed
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4">
                  Date
                </TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 tracking-wider py-4 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((bc) => (
                <TableRow
                  key={bc.id}
                  className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors"
                >
                  <TableCell className="py-4">
                    <div className="flex items-start gap-3">
                      {bc.banner_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={bc.banner_url}
                          alt="Banner"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5"
                        />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900">{bc.subject}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {bc.html_content
                            ? bc.html_content.replace(/<[^>]*>?/gm, "").slice(0, 80)
                            : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    {bc.audience === "All Users" || bc.audience === "ALL" ? (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200"
                      >
                        All Customers
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold bg-purple-50 text-purple-700 border-purple-200"
                      >
                        Targeted
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-4">{renderStatusBadge(bc.status)}</TableCell>

                  <TableCell className="py-4 text-xs font-bold text-slate-900">
                    {bc.total_sent || 0} / {bc.total_recipients || 0}
                  </TableCell>

                  <TableCell className="py-4 text-xs font-bold text-red-600">
                    {bc.total_failed || 0}
                  </TableCell>

                  <TableCell className="py-4 text-xs text-slate-600 font-medium">
                    {bc.sent_at
                      ? new Date(bc.sent_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })
                      : bc.created_at
                      ? new Date(bc.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })
                      : "N/A"}
                  </TableCell>

                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        onClick={() => onSelectRecipients(bc)}
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5 mr-1 text-slate-500" /> Logs
                      </Button>
                      <Button
                        onClick={() => onDelete(bc.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
