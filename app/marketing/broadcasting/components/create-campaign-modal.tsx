"use client"

import React, { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Mail, Folder, ChevronDown, Trash2, Search, Loader2, Send } from "lucide-react"
import { CreateBroadcastFormValues } from "./types"

const Editor = dynamic(() => import("@/components/ui/editor"), { ssr: false })

const defaultBroadcastValues: CreateBroadcastFormValues = {
  subject: "",
  content: "",
  banner_url: "",
  audience: "ALL",
  redirectUrl: ""
}

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  customersList: any[]
  initialSelectedCustomerIds?: string[]
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  customersList,
  initialSelectedCustomerIds = []
}: CreateCampaignModalProps) {
  const queryClient = useQueryClient()
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(initialSelectedCustomerIds)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")

  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateBroadcastFormValues>({
    defaultValues: defaultBroadcastValues
  })

  const currentAudience = watch("audience")
  const bannerUrl = watch("banner_url")

  // Image upload states
  const [bannerUploadMethod, setBannerUploadMethod] = useState<"url" | "file">("url")
  const [bannerLocalFile, setBannerLocalFile] = useState<File | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [isFoldersLoading, setIsFoldersLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Sync initialSelectedCustomerIds when provided
  useEffect(() => {
    if (initialSelectedCustomerIds.length > 0) {
      setSelectedCustomerIds(initialSelectedCustomerIds)
      setValue("audience", "SPECIFIC")
    }
  }, [initialSelectedCustomerIds, setValue])

  // Load GitHub folders on mount
  useEffect(() => {
    async function loadFolders() {
      setIsFoldersLoading(true)
      try {
        const res = await fetch("/api/upload/folders")
        if (res.ok) {
          const data = await res.json()
          if (data.folders && Array.isArray(data.folders)) {
            setFolders(data.folders)
            if (data.folders.length > 0) setSelectedFolder(data.folders[0])
          }
        }
      } catch (err) {
        console.error("Failed to load GitHub repository folders:", err)
      } finally {
        setIsFoldersLoading(false)
      }
    }
    loadFolders()
  }, [])

  // Auto-route folder based on filename (scoring logic)
  const autoRouteFolder = (filename: string) => {
    if (folders.length === 0) return
    const filenameLower = filename.toLowerCase()
    let bestMatch = ""
    let maxScore = 0
    for (const folderPath of folders) {
      const parts = folderPath.toLowerCase().split("/")
      const folderName = parts[parts.length - 1]
      const keywords = folderName.split(/[-_\s]/).filter((w) => w.length > 2)
      keywords.push(folderName)
      let score = 0
      for (const word of keywords) {
        if (filenameLower.includes(word)) score += word.length
      }
      if (score > maxScore) {
        maxScore = score
        bestMatch = folderPath
      }
    }
    if (maxScore > 0 && bestMatch) {
      setSelectedFolder(bestMatch)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerLocalFile(file)
    setValue("banner_url", URL.createObjectURL(file))
    autoRouteFolder(file.name)
  }

  useEffect(() => {
    if (!isOpen) {
      reset(defaultBroadcastValues)
      setSelectedCustomerIds([])
      setCustomerSearchQuery("")
      setBannerUploadMethod("url")
      setBannerLocalFile(null)
    }
  }, [isOpen, reset])

  // Filter customers directory based on search query
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customersList
    const q = customerSearchQuery.toLowerCase()
    return customersList.filter(
      (c: any) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    )
  }, [customerSearchQuery, customersList])

  // Mutation for creating email campaign
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/marketing/broadcasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to dispatch email campaign")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Email campaign dispatched successfully via Nodemailer!")
      onClose()
      queryClient.invalidateQueries({ queryKey: ["emailCampaigns"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    if (selectedFolder) {
      formData.append("folder", selectedFolder)
    }
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Image upload failed")
    return data.url
  }

  const onSubmitBroadcast = async (data: CreateBroadcastFormValues) => {
    if (!data.subject.trim()) {
      toast.error("Campaign Subject Title is required")
      return
    }
    if (!data.content.trim()) {
      toast.error("Email Message Content is required")
      return
    }
    if (data.audience === "SPECIFIC" && selectedCustomerIds.length === 0) {
      toast.error("Please select at least one customer for targeted email broadcast")
      return
    }

    setIsUploading(true)
    const toastId = "email-campaign-send"
    toast.loading("Processing email campaign dispatch...", { id: toastId })

    try {
      let finalBannerUrl = data.banner_url.trim()

      if (bannerUploadMethod === "file" && bannerLocalFile) {
        toast.loading("Uploading banner image to GitHub...", { id: toastId })
        finalBannerUrl = await uploadFile(bannerLocalFile)
      }

      toast.loading("Dispatching campaign...", { id: toastId })
      createMutation.mutate(
        {
          subject: data.subject.trim(),
          content: data.content.trim(),
          banner_url: finalBannerUrl || null,
          audience: data.audience,
          targetCustomerIds: selectedCustomerIds,
          redirectUrl: data.redirectUrl?.trim() || null
        },
        {
          onSuccess: (resData) => {
            toast.success(
              resData.message || "Email campaign dispatched successfully via Nodemailer!",
              { id: toastId }
            )
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to dispatch email campaign", { id: toastId })
          }
        }
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            Dispatch Nodemailer Email Campaign
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Subject Title */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 block">
              Campaign Subject Line <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("subject")}
              placeholder="e.g. 🎉 Exclusive 20% Discount Code Inside!"
              className="h-10 text-xs border-slate-200 bg-white text-slate-900 font-semibold shadow-sm"
            />
          </div>

          {/* Redirect URL */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 block">
              Redirect URL (Redirection destination link)
            </label>
            <Input
              {...register("redirectUrl")}
              placeholder="e.g. https://shopmarkline.in/products/women"
              className="h-10 text-xs border-slate-200 bg-white text-slate-900 font-semibold shadow-sm"
            />
          </div>

          {/* Banner Image Source Toggle & Directory Selector */}
          <div className="space-y-3 pt-1">
            <label className="text-[10px] font-bold text-slate-500 tracking-wider block">
              Banner Image Source
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBannerUploadMethod("url")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  bannerUploadMethod === "url"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Paste URL
              </button>
              <button
                type="button"
                onClick={() => setBannerUploadMethod("file")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  bannerUploadMethod === "file"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Upload File
              </button>
            </div>

            {bannerUploadMethod === "url" ? (
              <Input
                {...register("banner_url")}
                placeholder="https://images.unsplash.com/photo-..."
                className="h-9 text-xs border-slate-200 bg-white text-slate-900"
              />
            ) : (
              <div className="space-y-3">
                {/* GitHub Storage Folder Dropdown */}
                <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">GitHub Storage Folder</span>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedFolder}
                      disabled={isFoldersLoading}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full h-9 pl-3 pr-10 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {isFoldersLoading ? (
                        <option value="">Loading repository folders...</option>
                      ) : (
                        <>
                          <option value="">/ (Root)</option>
                          {folders.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* File Input */}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="h-10 text-xs border-slate-200 bg-white text-slate-900 cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>
            )}

            {/* Banner Image Preview */}
            {bannerUrl && (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden mt-3 bg-slate-50">
                <div className="aspect-[21/9] w-full flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerUrl}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        "https://placehold.co/900x385?text=Invalid+Image+URL"
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValue("banner_url", "")
                    setBannerLocalFile(null)
                  }}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Message Content with Rich Text Editor */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 block">
              Email Message Body <span className="text-red-500">*</span>
            </label>
            <div className="shadow-sm border border-slate-200 rounded-md overflow-hidden bg-white">
              <Editor
                value={watch("content") || ""}
                onChange={(val) => setValue("content", val)}
                height={280}
              />
            </div>
          </div>

          {/* Target Audience Strategy */}
          <div className="border-t border-slate-100 pt-4">
            <label className="text-[10px] font-bold text-slate-500 tracking-wider mb-2 block">
              Target Audience Strategy
            </label>
            <Select
              value={currentAudience}
              onValueChange={(val: any) => setValue("audience", val)}
            >
              <SelectTrigger className="w-full h-10 text-xs font-semibold text-slate-900 border-slate-200 bg-white shadow-sm">
                <SelectValue placeholder="Select target..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="ALL" className="text-xs font-semibold">
                  Broadcast to All Active Registered Customers
                </SelectItem>
                <SelectItem value="SPECIFIC" className="text-xs font-semibold">
                  Select Specific Customers / Recipients
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Selector (When audience === 'SPECIFIC') */}
          {currentAudience === "SPECIFIC" && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">
                  Selected Recipients ({selectedCustomerIds.length})
                </span>
                {selectedCustomerIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerIds([])}
                    className="text-[10px] font-bold text-red-600 hover:underline"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Customer Search Bar */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search customer by name, email, or phone..."
                  className="pl-8 text-xs border-slate-200 bg-white h-8"
                />
              </div>

              {/* Customer Options List */}
              <div className="max-h-48 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-lg p-1">
                {filteredCustomers.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                    No customers found matching search.
                  </p>
                ) : (
                  filteredCustomers.map((cust: any) => {
                    const targetKey = cust.id || cust.email
                    const isSelected = selectedCustomerIds.includes(targetKey)
                    return (
                      <div
                        key={targetKey}
                        onClick={() => toggleSelectCustomer(targetKey)}
                        className={`px-3 py-2 text-xs font-semibold cursor-pointer rounded-md flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                          <p className="text-[10px] text-slate-500">{cust.email}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold border-slate-200 text-slate-600 bg-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            disabled={createMutation.isPending || isUploading}
            onClick={handleSubmit(onSubmitBroadcast)}
            className="text-xs font-bold bg-black text-white hover:bg-black/90 shadow-sm cursor-pointer"
          >
            {createMutation.isPending || isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Dispatched...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 mr-2" /> Dispatch Email Campaign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
