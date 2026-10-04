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
import { Mail, Loader2 } from "lucide-react"
import { EmailCampaignItem, EmailCampaignRecipientItem } from "./types"

interface RecipientLogsModalProps {
  campaign: EmailCampaignItem | null
  onClose: () => void
}

export function RecipientLogsModal({ campaign, onClose }: RecipientLogsModalProps) {
  // Fetch recipients for selected campaign modal
  const { data: recipientsData, isLoading: isLoadingRecipients } = useQuery({
    queryKey: ["emailCampaignRecipients", campaign?.id],
    queryFn: async () => {
      if (!campaign) return null
      const res = await fetch(`/api/marketing/broadcasting/${campaign.id}/recipients`)
      if (!res.ok) throw new Error("Failed to fetch campaign recipients log")
      return res.json()
    },
    enabled: !!campaign
  })

  const recipientsList: EmailCampaignRecipientItem[] = recipientsData?.recipients || []

  return (
    <Dialog
      open={!!campaign}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-600" />
              Email Campaign Recipients & Delivery Log
            </span>
            {campaign && (
              <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700">
                ID #{campaign.id}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {campaign && (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold text-slate-900">{campaign.subject}</p>
              <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-500">
                <span>Sent: {campaign.total_sent}</span>
                <span>•</span>
                <span>Failed: {campaign.total_failed}</span>
                <span>•</span>
                <span>Audience: {campaign.audience}</span>
              </div>
            </div>

            {isLoadingRecipients ? (
              <div className="py-12 text-center">
                <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Loading recipient logs...</p>
              </div>
            ) : recipientsList.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs font-semibold text-slate-400">
                  No recipient logs recorded for this campaign.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Recipient Email
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Name
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Delivery Status
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Dispatched Time
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 py-3">
                        Error Log
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipientsList.map((rec) => (
                      <TableRow
                        key={rec.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50"
                      >
                        <TableCell className="py-2.5 text-xs text-slate-900 font-bold">
                          {rec.email}
                        </TableCell>

                        <TableCell className="py-2.5 text-xs text-slate-600 font-medium">
                          {rec.name || "N/A"}
                        </TableCell>

                        <TableCell className="py-2.5">
                          {rec.delivery_status === "Sent" ||
                          rec.delivery_status === "Delivered" ||
                          rec.delivery_status === "SENT" ||
                          rec.delivery_status === "DELIVERED" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              Sent / Delivered
                            </Badge>
                          ) : rec.delivery_status === "Failed" ||
                            rec.delivery_status === "FAILED" ||
                            rec.delivery_status === "Bounced" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-red-50 text-red-700 border-red-200"
                            >
                              {rec.delivery_status}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-amber-50 text-amber-700 border-amber-200"
                            >
                              {rec.delivery_status}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 text-[10px] text-slate-500 font-medium">
                          {rec.sent_at
                            ? new Date(rec.sent_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit"
                              })
                            : "N/A"}
                        </TableCell>

                        <TableCell className="py-2.5 text-[10px] text-red-600 font-mono">
                          {rec.error_message || "-"}
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
            className="text-xs font-bold border-slate-200 text-slate-600 cursor-pointer"
          >
            Close Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
