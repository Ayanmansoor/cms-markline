"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusIcon, Pencil, Trash2, KeyRound, ShieldCheck, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface TokenFormValues {
  tokenValue: string
  expiresAt: string
}

const defaultFormValues: TokenFormValues = {
  tokenValue: "",
  expiresAt: "",
}

export function ShiprocketTab() {
  const queryClient = useQueryClient()
  const [isShiprocketDialogOpen, setIsShiprocketDialogOpen] = useState(false)
  const [editToken, setEditToken] = useState<any>(null)
  const [now] = useState(() => Date.now())

  const { register, reset, getValues } = useForm<TokenFormValues>({
    defaultValues: defaultFormValues,
  })

  // Fetch all tokens
  const { data: tokensResponse, isLoading: isTokensLoading } = useQuery({
    queryKey: ["settings-shiprocket-tokens"],
    queryFn: async () => {
      const res = await fetch("/api/settings/shiprocket")
      if (!res.ok) throw new Error("Failed to fetch Shiprocket tokens")
      const data = await res.json()
      if (data?.tokens?.length > 0) {
        const latest = data.tokens[data.tokens.length - 1]
        if (latest?.token_value) {
          document.cookie = `shiprocket_token=${latest.token_value}; path=/; max-age=${10 * 24 * 60 * 60}`
        }
      }
      return data
    }
  })

  const tokens = tokensResponse?.tokens || []

  // Create Token Mutation
  const createTokenMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/settings/shiprocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create Shiprocket token")
      return res.json()
    },
    onSuccess: (data) => {
      toast.success("Shiprocket token created successfully!")
      if (data?.token?.token_value) {
        document.cookie = `shiprocket_token=${data.token.token_value}; path=/; max-age=${10 * 24 * 60 * 60}`
      }
      queryClient.invalidateQueries({ queryKey: ["settings-shiprocket-tokens"] })
      closeShiprocketModal()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create Shiprocket token")
    }
  })

  // Update Token Mutation
  const updateTokenMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/settings/shiprocket/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update Shiprocket token")
      return res.json()
    },
    onSuccess: (data) => {
      toast.success("Shiprocket token updated successfully!")
      if (data?.token?.token_value) {
        document.cookie = `shiprocket_token=${data.token.token_value}; path=/; max-age=${10 * 24 * 60 * 60}`
      }
      queryClient.invalidateQueries({ queryKey: ["settings-shiprocket-tokens"] })
      closeShiprocketModal()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update Shiprocket token")
    }
  })

  // Delete Token Mutation
  const deleteTokenMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/settings/shiprocket/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete token")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Shiprocket token deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["settings-shiprocket-tokens"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete token")
    }
  })

  // Auto-Authenticate Mutation
  const authenticateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/shiprocket/authenticate", {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to authenticate with Shiprocket")
      return data
    },
    onSuccess: (data) => {
      toast.success("Shiprocket token generated and saved successfully!")
      if (data?.token?.token_value) {
        document.cookie = `shiprocket_token=${data.token.token_value}; path=/; max-age=${10 * 24 * 60 * 60}`
      }
      queryClient.invalidateQueries({ queryKey: ["settings-shiprocket-tokens"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to authenticate with Shiprocket")
    }
  })

  const openCreateTokenModal = () => {
    setEditToken(null)
    reset(defaultFormValues)
    setIsShiprocketDialogOpen(true)
  }

  const openEditTokenModal = (token: any) => {
    setEditToken(token)
    let dateStr = ""
    if (token.expires_at) {
      dateStr = token.expires_at.split("T")[0]
    }
    reset({
      tokenValue: token.token_value || "",
      expiresAt: dateStr,
    })
    setIsShiprocketDialogOpen(true)
  }

  const closeShiprocketModal = () => {
    setIsShiprocketDialogOpen(false)
    setEditToken(null)
  }

  const handleSaveToken = () => {
    const v = getValues()
    if (!v.tokenValue.trim()) {
      toast.error("Token value is required!")
      return
    }

    const payload = {
      token_value: v.tokenValue.trim(),
      expires_at: v.expiresAt ? v.expiresAt : null
    }

    if (editToken) {
      updateTokenMutation.mutate({ id: editToken.id, payload })
    } else {
      createTokenMutation.mutate(payload)
    }
  }

  const handleDeleteToken = (id: number) => {
    if (confirm(`Are you sure you want to delete this token?`)) {
      deleteTokenMutation.mutate(id)
    }
  }

  const getExpirationInfo = (expiresAt: string | null, now: number) => {
    if (!expiresAt) return { percent: 0, color: "bg-slate-300", label: "No expiry" }
    const expires = new Date(expiresAt).getTime()
    const total = 10 * 24 * 60 * 60 * 1000
    const remaining = Math.max(0, expires - now)
    const percent = Math.min(100, (remaining / total) * 100)

    if (percent <= 0) return { percent: 0, color: "bg-red-500", label: "Expired" }
    if (percent < 10) return { percent, color: "bg-red-500", label: `${Math.round(percent)}% left` }
    if (percent < 50) return { percent, color: "bg-amber-500", label: `${Math.round(percent)}% left` }
    return { percent, color: "bg-emerald-500", label: `${Math.round(percent)}% left` }
  }

  return (
    <div className="grid grid-cols-1 gap-6 ">
      {/* Auto-Authenticate Card */}
      <Card className="shadow-sm border border-emerald-200 rounded-xl bg-gradient-to-br from-emerald-50/50 to-white">
        <CardContent className="p-5 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Auto-Authenticate</h3>
              <p className="text-xs text-slate-500">
                Generate a token automatically using credentials from your .env file. Token expires in 10 days.
              </p>
            </div>
          </div>
          <Button
            onClick={() => authenticateMutation.mutate()}
            disabled={authenticateMutation.isPending}
            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm whitespace-nowrap"
          >
            <KeyRound className="h-4 w-4 mr-1.5" />
            {authenticateMutation.isPending ? "Authenticating..." : "Authenticate & Generate Token"}
          </Button>
        </CardContent>
      </Card>

      {/* Credentials Warning */}

      <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-950">Shiprocket Tokens</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Manage API tokens for Shiprocket integration to process shipments and synchronize shipping details.
            </CardDescription>
          </div>

        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest pl-6">TOKEN ID</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">TOKEN VALUE</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">EXPIRES AT</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">CREATED</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest">VALIDITY</TableHead>
                <TableHead className="h-11 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center pr-6">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTokensLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-400">
                    Loading tokens...
                  </TableCell>
                </TableRow>
              ) : tokens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-400">
                    No Shiprocket tokens configured. Add a token to enable the integration.
                  </TableCell>
                </TableRow>
              ) : (
                tokens.map((token: any) => {
                  const expiresDate = token.expires_at ? new Date(token.expires_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Never'

                  const createdDate = token.created_at ? new Date(token.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'

                  const expiration = getExpirationInfo(token.expires_at, now)

                  return (
                    <TableRow key={token.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="py-4 pl-6">
                        <span className="text-xs font-bold text-slate-800">#{token.id}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-mono font-semibold text-slate-600 block max-w-xs truncate">{token.token_value}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-semibold text-slate-705">{expiresDate}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-semibold text-slate-505">{createdDate}</span>
                      </TableCell>
                      <TableCell className="py-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${expiration.color}`}
                              style={{ width: `${expiration.percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">{expiration.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center pr-6">
                        <div className="flex justify-center gap-1.5">

                          <Button
                            disabled={deleteTokenMutation.isPending}
                            onClick={() => handleDeleteToken(token.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


    </div>
  )
}
