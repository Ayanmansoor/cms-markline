"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LinkIcon, CopyIcon, MonitorIcon, SmartphoneIcon, ImageIcon, ArrowLeft, Trash2Icon, FolderIcon, ChevronDownIcon, TrashIcon } from "lucide-react"
import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useForm } from "react-hook-form"

interface BannerFormValues {
  name: string
  slug: string
  imageUrl: string
  targetUrl: string
  isMobile: boolean
  isEnabled: boolean
}

const defaultFormValues: BannerFormValues = {
  name: "",
  slug: "",
  imageUrl: "",
  targetUrl: "",
  isMobile: false,
  isEnabled: true,
}

export default function EditBannerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()

  const { register, watch, setValue, reset, getValues } = useForm<BannerFormValues>({
    defaultValues: defaultFormValues,
  })

  const name = watch("name")
  const slug = watch("slug")
  const imageUrl = watch("imageUrl")
  const targetUrl = watch("targetUrl")
  const isMobile = watch("isMobile")
  const isEnabled = watch("isEnabled")

  // ── Image upload states ───────────────────────────────────────────────────
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url")
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [isFoldersLoading, setIsFoldersLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch banner data
  const { data: bannerResponse, isLoading: isBannerLoading } = useQuery({
    queryKey: ["banner", id],
    queryFn: async () => {
      const res = await fetch(`/api/banners/${id}`)
      if (!res.ok) throw new Error("Failed to fetch banner details")
      return res.json()
    },
    enabled: !!id
  })

  // Populate form states once data is fetched
  useEffect(() => {
    if (bannerResponse?.success && bannerResponse.banner) {
      const b = bannerResponse.banner
      reset({
        name: b.name || "",
        slug: b.slug || "",
        imageUrl: b.image_url || "",
        targetUrl: b.url || "",
        isMobile: b.isMobile === true,
        isEnabled: b.isEnable !== false,
      })
    }
  }, [bannerResponse, reset])

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
      const parts = folderPath.toLowerCase().split('/')
      const folderName = parts[parts.length - 1]
      const keywords = folderName.split(/[-_\s]/).filter(w => w.length > 2)
      keywords.push(folderName)
      let score = 0
      for (const word of keywords) {
        if (filenameLower.includes(word)) score += word.length
      }
      if (score > maxScore) { maxScore = score; bestMatch = folderPath }
    }
    if (maxScore > 0 && bestMatch) {
      setSelectedFolder(bestMatch)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLocalFile(file)
    setValue("imageUrl", URL.createObjectURL(file))
    autoRouteFolder(file.name)
  }

  // React Query: Update Banner Mutation
  const updateBannerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update banner")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] })
      queryClient.invalidateQueries({ queryKey: ["banner", id] })
      router.push("/banners")
    }
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete banner")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Banner deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["banners"] })
      router.push("/banners")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete banner")
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
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Image upload failed")
    return data.url
  }

  const handleSave = async () => {
    const v = getValues()

    if (!v.name.trim()) {
      toast.error("Banner name is required!")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading("Processing banner changes...")

    try {
      let finalImageUrl = v.imageUrl.trim()

      if (uploadMethod === "file" && localFile) {
        toast.loading("Uploading banner image to GitHub...", { id: toastId })
        finalImageUrl = await uploadFile(localFile)
      }

      const payload = {
        name: v.name.trim(),
        slug: v.slug.trim() || null,
        image_url: finalImageUrl || null,
        url: v.targetUrl.trim() || null,
        isMobile: v.isMobile,
        isEnable: v.isEnabled
      }

      toast.loading("Saving banner changes...", { id: toastId })
      updateBannerMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Banner updated successfully!", { id: toastId })
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update banner", { id: toastId })
        }
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the banner "${name}"?`)) {
      deleteMutation.mutate()
    }
  }

  // Auto-generate slug from name
  const handleGenerateSlug = () => {
    const nameVal = getValues("name")
    if (nameVal) {
      const generated = nameVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      setValue("slug", generated)
    }
  }

  const isPending = isBannerLoading || updateBannerMutation.isPending || deleteMutation.isPending || isUploading

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.push("/banners")}
                className="h-8 w-8 text-slate-500 hover:text-slate-800 border-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <span className="hover:text-slate-900 cursor-pointer" onClick={() => router.push("/banners")}>Banners</span>
                  <span className="text-slate-300">&gt;</span>
                  <span className="text-blue-600">Edit Banner</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] truncate max-w-md">
                  {name || "Edit Banner"}
                </h1>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white"
              >
                <Trash2Icon className="h-4 w-4 mr-1.5" /> Delete Banner
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/banners")}
                disabled={isPending}
                className="text-xs font-bold text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isPending}
                className="text-xs font-bold text-white bg-black hover:bg-black/90 px-5"
              >
                {updateBannerMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {isBannerLoading ? (
            <div className="text-sm font-medium text-slate-500 py-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
              Loading banner details...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

              {/* Left Column - Form Details */}
              <div className="space-y-6">
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-950">Banner Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    
                    {/* Name */}
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">BANNER NAME</Label>
                      <Input
                        {...register("name")}
                        className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
                        placeholder="e.g. Summer Showcase Sale 2026"
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">SLUG IDENTIFIER</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center flex-1 bg-slate-50 rounded-md border border-slate-200 px-3 py-2">
                          <span className="text-xs text-slate-400 mr-1 select-none">banners/</span>
                          <input
                            type="text"
                            {...register("slug")}
                            placeholder="summer-showcase-sale"
                            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 flex-1 min-w-0"
                          />
                          {name && !slug && (
                            <button 
                              type="button"
                              onClick={handleGenerateSlug}
                              className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Image Upload/URL Toggle */}
                    <div className="space-y-4 pt-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Banner Image Source</Label>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUploadMethod("url")}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            uploadMethod === "url"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          Paste URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod("file")}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            uploadMethod === "file"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          Upload File
                        </button>
                      </div>

                      {uploadMethod === "url" ? (
                        <div className="relative">
                          <ImageIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={imageUrl}
                            onChange={e => setValue("imageUrl", e.target.value)}
                            className="h-10 pl-9 text-sm font-semibold border-slate-200 text-slate-900 bg-white"
                            placeholder="https://example.com/images/summer-banner.jpg"
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* GitHub Storage Directory */}
                          <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                              <FolderIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-bold text-slate-900">GitHub Storage Folder</span>
                            </div>
                            <div className="relative">
                              <select
                                value={selectedFolder}
                                disabled={isFoldersLoading}
                                onChange={e => setSelectedFolder(e.target.value)}
                                className="w-full h-9 pl-3 pr-10 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              >
                                {isFoldersLoading ? (
                                  <option value="">Loading repository folders...</option>
                                ) : (
                                  <>
                                    <option value="">/ (Root)</option>
                                    {folders.map(f => (
                                      <option key={f} value={f}>{f}</option>
                                    ))}
                                  </>
                                )}
                              </select>
                              <ChevronDownIcon className="absolute right-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                          </div>

                          {/* File selector */}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="h-10 text-sm font-semibold border-slate-200 text-slate-900 cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                          />
                        </div>
                      )}

                      {/* Image Preview Card */}
                      {imageUrl && (
                        <div className="relative border border-slate-200 rounded-xl overflow-hidden mt-3 bg-slate-50">
                          <div className="aspect-[21/9] w-full flex items-center justify-center overflow-hidden">
                            <img
                              src={imageUrl}
                              alt="Banner Preview"
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/900x385?text=Invalid+Image+URL" }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setValue("imageUrl", "")
                              setLocalFile(null)
                            }}
                            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Target Redirect URL */}
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">TARGET REDIRECT URL (WHERE TO JUMP)</Label>
                      <div className="relative">
                        <LinkIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          {...register("targetUrl")}
                          className="h-10 pl-9 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1"
                          placeholder="https://marklinestore.com/products/summer-collection"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 italic">The URL link destination when a shopper clicks this banner image.</p>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Device Configuration & Preview */}
              <div className="space-y-6">

                {/* Banner Status Widget */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-950">Banner Status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-slate-900">Enable Banner</Label>
                        <p className="text-[10px] text-slate-500">Control if this banner is active and visible on the storefront.</p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(v) => setValue("isEnabled", v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Device Selector Widget */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-950">Target Device</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Device Type</Label>
                      <Select 
                        value={isMobile ? "mobile" : "desktop"} 
                        onValueChange={(val) => setValue("isMobile", val === "mobile")}
                      >
                        <SelectTrigger className="w-full border-slate-200 text-slate-900 text-xs font-semibold h-9">
                          <SelectValue placeholder="Select device..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                          <SelectItem value="desktop" className="text-xs font-semibold">Desktop (Wide Banner)</SelectItem>
                          <SelectItem value="mobile" className="text-xs font-semibold">Mobile (Portrait Banner)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Preview Widget */}
                <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-widest">LIVE MOCKUP PREVIEW</CardTitle>
                    <Badge variant="outline" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      {isMobile ? "Mobile screen" : "Desktop screen"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6 bg-slate-50 flex items-center justify-center min-h-[300px]">
                    
                    {isMobile ? (
                      /* Mobile Screen mockup */
                      <div className="w-[180px] h-[320px] bg-slate-900 rounded-[28px] border-[6px] border-slate-800 shadow-xl overflow-hidden relative flex flex-col items-center">
                        {/* Notch */}
                        <div className="w-16 h-3 bg-slate-800 rounded-b-md absolute top-0 z-20"></div>
                        
                        {/* Inner Screen */}
                        <div className="w-full h-full flex flex-col bg-white">
                          <div className="h-6 bg-slate-100 border-b border-slate-200 flex items-center px-3 justify-between">
                            <span className="text-[7px] font-bold text-slate-400">9:41</span>
                            <div className="flex gap-0.5 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              <span className="w-2.5 h-1.5 bg-slate-300 rounded-sm"></span>
                            </div>
                          </div>
                          
                          <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
                            <div className="h-3 w-12 bg-slate-200 rounded"></div>
                            
                            {/* Banner Container */}
                            <div className="w-full aspect-[9/16] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative group shrink-0">
                              {imageUrl ? (
                                <img src={imageUrl} alt="Mobile preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center p-2 text-center">
                                  <SmartphoneIcon className="h-8 w-8 text-slate-400 mb-1" />
                                  <span className="text-[8px] font-bold text-slate-500 leading-tight">No image URL specified</span>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[7px] font-black uppercase px-1 py-0.5 rounded">
                                SHOP NOW
                              </div>
                            </div>
                            
                            <div className="h-3 w-full bg-slate-100 rounded"></div>
                            <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Desktop Screen mockup */
                      <div className="w-full max-w-[280px] bg-slate-200 rounded-lg border border-slate-300 shadow-xl overflow-hidden flex flex-col">
                        <div className="h-4 bg-slate-300 border-b border-slate-400 flex items-center px-2 gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          <span className="text-[7px] text-slate-500 font-bold ml-2">marklinestore.com</span>
                        </div>
                        
                        <div className="bg-white p-2 flex flex-col gap-2 min-h-[160px]">
                          {/* Desktop Header */}
                          <div className="flex justify-between items-center h-4 border-b border-slate-100 pb-1">
                            <span className="text-[8px] font-black">MARKLINE</span>
                            <div className="flex gap-2">
                              <span className="h-1.5 w-6 bg-slate-200 rounded"></span>
                              <span className="h-1.5 w-6 bg-slate-200 rounded"></span>
                            </div>
                          </div>

                          {/* Banner Container */}
                          <div className="w-full aspect-[21/9] bg-slate-100 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center relative group shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt="Desktop preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center p-2 text-center">
                                <MonitorIcon className="h-8 w-8 text-slate-400 mb-1" />
                                <span className="text-[8px] font-bold text-slate-500 leading-tight">No image URL specified</span>
                              </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[7px] font-black uppercase px-1 py-0.5 rounded">
                              EXPLORE COLLECTION
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="h-8 bg-slate-100 rounded"></div>
                            <div className="h-8 bg-slate-100 rounded"></div>
                            <div className="h-8 bg-slate-100 rounded"></div>
                          </div>
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>

              </div>

            </div>
          )}

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
