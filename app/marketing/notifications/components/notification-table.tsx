"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bell,
  Loader2,
  Users,
  ExternalLink,
  Flame,
  Calendar,
  Megaphone,
  ShoppingBag,
  Info,
  Smartphone,
  Clock,
  CheckCheck,
  Pencil,
  Trash2
} from "lucide-react"
import { NotificationItem } from "./types"

interface NotificationTableProps {
  notifications: NotificationItem[]
  isLoading: boolean
  onSelectRecipients: (notif: NotificationItem) => void
  onEdit: (notif: NotificationItem) => void
  onDelete: (id: number) => void
}

export function NotificationTable({
  notifications,
  isLoading,
  onSelectRecipients,
  onEdit,
  onDelete
}: NotificationTableProps) {
  const renderTypeBadge = (type: NotificationItem["notification_type"]) => {
    switch (type) {
      case "PROMOTIONAL":
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1 w-max">
            <Flame className="h-3 w-3" /> Promotional
          </Badge>
        )
      case "ORDER_UPDATE":
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 w-max">
            <ShoppingBag className="h-3 w-3" /> Order Update
          </Badge>
        )
      case "ANNOUNCEMENT":
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 w-max">
            <Megaphone className="h-3 w-3" /> Announcement
          </Badge>
        )
      case "SYSTEM":
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 w-max">
            <Info className="h-3 w-3" /> System
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 w-max">
            <Smartphone className="h-3 w-3" /> Push
          </Badge>
        )
    }
  }

  const renderStatusBadge = (status: NotificationItem["status"]) => {
    switch (status) {
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Sent
          </span>
        )
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 text-amber-500" />
            Scheduled
          </span>
        )
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-slate-100 text-slate-600 border-slate-200">
            Draft
          </span>
        )
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
            Cancelled
          </span>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading notifications log...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-24 text-center">
          <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">No notifications found matching your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-xs font-semibold text-slate-600 py-4">Title & Content</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 py-4">Type & Audience</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 py-4">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 py-4">Sent / Reach</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 py-4">Total Read</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 py-4">Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notif) => (
                <TableRow key={notif.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-start gap-3">
                      {notif.banner_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={notif.banner_url}
                          alt="Banner"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5"
                        />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        {notif.action_url && (
                          <a
                            href={notif.action_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                          >
                            Link: {notif.action_url} <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 space-y-1">
                    {renderTypeBadge(notif.notification_type)}
                    {notif.audience === "ALL" ? (
                      <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200 block w-max">
                        All Customers
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-bold bg-purple-50 text-purple-700 border-purple-200 block w-max">
                        Targeted Users
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-4">
                    {renderStatusBadge(notif.status)}
                  </TableCell>

                  <TableCell className="py-4">
                    <p className="text-xs font-bold text-slate-900">
                      {notif.total_sent} / {notif.total_recipients}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">recipients</p>
                  </TableCell>

                  <TableCell className="py-4">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                      {notif.total_read}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {notif.total_sent > 0 ? `${((notif.total_read / notif.total_sent) * 100).toFixed(0)}% read` : '0%'}
                    </p>
                  </TableCell>

                  <TableCell className="py-4 text-xs text-slate-600 font-medium">
                    {notif.status === "SCHEDULED" && notif.scheduled_at ? (
                      <div>
                        <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Scheduled
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(notif.scheduled_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {notif.sent_at ? new Date(notif.sent_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric"
                          }) : new Date(notif.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric"
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {notif.sent_at ? new Date(notif.sent_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit"
                          }) : ""}
                        </p>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        onClick={() => onSelectRecipients(notif)}
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5 mr-1 text-slate-500" /> Logs
                      </Button>

                      <Button
                        onClick={() => onEdit(notif)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        onClick={() => onDelete(notif.id)}
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
