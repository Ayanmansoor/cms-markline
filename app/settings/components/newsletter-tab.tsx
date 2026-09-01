"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Inbox } from "lucide-react"
import { toast } from "sonner"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export function NewsletterTab() {
  const queryClient = useQueryClient()
  const [subscriberSearch, setSubscriberSearch] = useState("")

  // Fetch subscribers
  const { data: subscribersResponse, isLoading: isSubscribersLoading } = useQuery({
    queryKey: ["settings-subscribers"],
    queryFn: async () => {
      const res = await fetch("/api/settings/subscribe")
      if (!res.ok) throw new Error("Failed to fetch subscribers")
      return res.json()
    }
  })

  const subscribers = subscribersResponse?.subscribers || []

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; email: string } | null>(null)

  // Delete Subscriber Mutation
  const deleteSubscriberMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/settings/subscribe/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete subscriber")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Subscriber removed successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-subscribers"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove subscriber")
    }
  })

  const handleDeleteSubscriber = (id: number, email: string) => {
    setDeleteTarget({ id, email })
  }

  const filteredSubscribers = subscribers.filter((sub: any) =>
    (sub.email || "").toLowerCase().includes(subscriberSearch.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 gap-6 ">
      <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-950">Newsletter Subscribers</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              View and manage customers who signed up for catalog update emails on your landing page.
            </CardDescription>
          </div>
          <Input
            placeholder="Search email..."
            value={subscriberSearch}
            onChange={(e) => setSubscriberSearch(e.target.value)}
            className="max-w-xs h-8 text-xs bg-slate-50/50"
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest pl-6">ID</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">SUBSCRIBER EMAIL</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">SIGN UP DATE</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center pr-6">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSubscribersLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-8 text-center text-xs font-semibold text-slate-400">
                    Loading subscribers...
                  </TableCell>
                </TableRow>
              ) : filteredSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-8 text-center text-xs font-semibold text-slate-400">
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Inbox className="h-6 w-6 text-slate-300" />
                      <span>No subscribers found matching your criteria.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscribers.map((sub: any) => {
                  const signUpDate = sub.created_at ? new Date(sub.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'

                  return (
                    <TableRow key={sub.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="py-4 pl-6">
                        <span className="text-xs font-bold text-slate-800">#{sub.id}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-bold text-slate-700">{sub.email}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-semibold text-slate-500">{signUpDate}</span>
                      </TableCell>
                      <TableCell className="py-4 text-center pr-6">
                        <Button
                          disabled={deleteSubscriberMutation.isPending}
                          onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteSubscriberMutation.mutate(deleteTarget.id)}
        itemName={deleteTarget?.email}
        title="Remove Subscriber"
        isPending={deleteSubscriberMutation.isPending}
      />
    </div>
  )
}
