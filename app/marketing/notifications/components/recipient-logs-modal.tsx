"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Loader2, CheckCheck, MousePointerClick } from "lucide-react"
import { NotificationItem, NotificationRecipientItem } from "./types"

interface RecipientLogsModalProps {
  notification: NotificationItem | null
  onClose: () => void
}

export function RecipientLogsModal({ notification, onClose }: RecipientLogsModalProps) {
  // Fetch recipients for selected notification
  const { data: recipientsData, isLoading: isLoadingRecipients } = useQuery({
    queryKey: ["notificationRecipients", notification?.id],
    queryFn: async () => {
      if (!notification) return null
      const res = await fetch(`/api/marketing/notifications/${notification.id}/recipients`)
      if (!res.ok) throw new Error("Failed to fetch recipients log")
      return res.json()
    },
    enabled: !!notification
  })

  const recipientsList: NotificationRecipientItem[] = recipientsData?.recipients || []

  return (
    <Dialog
      open={!!notification}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Recipient Delivery & Read Log
            </span>
            {notification && (
              <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700">
                ID #{notification.id}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {notification && (
          <div className="space-y-4 py-2">
            {/* Notification Summary Box */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold text-slate-900">{notification.title}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{notification.message}</p>
              <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-500">
                <span>Sent: {notification.total_sent}</span>
                <span>•</span>
                <span>Read: {notification.total_read}</span>
                <span>•</span>
                <span>Type: {notification.notification_type}</span>
              </div>
            </div>

            {/* Recipients Table */}
            {isLoadingRecipients ? (
              <div className="py-12 text-center">
                <Loader2 className="h-6 w-6 text-purple-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Loading recipient logs...</p>
              </div>
            ) : recipientsList.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs font-semibold text-slate-400">
                  No individual recipient logs recorded yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        User ID
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Delivery Status
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Is Read?
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Is Clicked?
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Timestamp
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipientsList.map((rec) => (
                      <TableRow
                        key={rec.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50"
                      >
                        <TableCell className="py-2.5 font-mono text-[11px] text-slate-800 font-semibold">
                          {rec.user_id}
                        </TableCell>

                        <TableCell className="py-2.5">
                          {rec.delivery_status === "DELIVERED" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              Delivered
                            </Badge>
                          ) : rec.delivery_status === "FAILED" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-red-50 text-red-700 border-red-200"
                            >
                              Failed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {rec.delivery_status || "Sent"}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5">
                          {rec.is_read ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                              Read (
                              {rec.read_at
                                ? new Date(rec.read_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : "Yes"}
                              )
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Unread</span>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5">
                          {rec.is_clicked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700">
                              <MousePointerClick className="h-3.5 w-3.5 text-purple-600" />
                              Clicked
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">No</span>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 text-[10px] text-slate-500 font-medium">
                          {rec.sent_at
                            ? new Date(rec.sent_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit"
                              })
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold border-slate-200 text-slate-600"
          >
            Close Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
