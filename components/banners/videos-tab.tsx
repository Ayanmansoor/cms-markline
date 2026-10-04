"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
  Pencil,
  PlayIcon,
  FileVideoIcon,
  UploadIcon,
  LinkIcon,
  Loader2,
  PlusIcon
} from "lucide-react"

interface VideosTabProps {
  isAddOpen: boolean
  onAddOpenChange: (open: boolean) => void
}

interface VideoFormValues {
  internal_url: string
  sort_order: number | string
  is_active: boolean
  upload_method: "url" | "file"
}

export function VideosTab({ isAddOpen, onAddOpenChange }: VideosTabProps) {
  const queryClient = useQueryClient()

  // ── Shop Videos List/Filter States ─────────────────────────────────────────
  const [videoPage, setVideoPage] = useState(1)
  const [videoLimit, setVideoLimit] = useState(10)
  const [videoStatusFilter, setVideoStatusFilter] = useState<string>("all")
  const [videoSearchValue, setVideoSearchValue] = useState<string>("")
  const [videoDebouncedSearch, setVideoDebouncedSearch] = useState<string>("")
  const [videoDeleteTarget, setVideoDeleteTarget] = useState<{ id: string; url: string } | null>(null)

  // ── Shop Videos Form Modal States ──────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingVideo, setEditingVideo] = useState<any>(null)

  // File upload state (outside React Hook Form for custom file handling)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  // ── React Hook Form Configuration ──────────────────────────────────────────
  const { register, handleSubmit, watch, setValue, reset } = useForm<VideoFormValues>({
    defaultValues: {
      internal_url: "",
      sort_order: "0",
      is_active: true,
      upload_method: "url"
    }
  })

  const uploadMethod = watch("upload_method")
  const isActive = watch("is_active")

  // Sync external add trigger from parent page header
  useEffect(() => {
    if (isAddOpen) {
      resetVideoForm()
      setFormMode("create")
      setIsFormOpen(true)
      onAddOpenChange(false)
    }
  }, [isAddOpen])

  // Debounce search input for videos
  useEffect(() => {
    const handler = setTimeout(() => {
      setVideoDebouncedSearch(videoSearchValue)
      setVideoPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [videoSearchValue])

  // ── Shop Videos Queries & Mutations ─────────────────────────────────────────
  const { data: videosData, isLoading: isVideosLoading, error: videosError } = useQuery({
    queryKey: ["shop_videos", videoPage, videoLimit, videoStatusFilter, videoDebouncedSearch],
    queryFn: async () => {
      let url = `/api/shop-videos?page=${videoPage}&limit=${videoLimit}`
      if (videoStatusFilter !== "all") {
        url += `&status=${videoStatusFilter}`
      }
      if (videoDebouncedSearch) {
        url += `&search=${encodeURIComponent(videoDebouncedSearch)}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch shop videos")
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })

  // Delete Video Mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shop-videos/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete video")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Shop video deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["shop_videos"] })
      setVideoDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete shop video")
    }
  })

  const handleDeleteVideo = (id: string, url: string) => {
    setVideoDeleteTarget({ id, url })
  }

  // Toggle Video Active Mutation
  const toggleVideoActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/shop-videos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update video status")
      return data
    },
    onSuccess: () => {
      toast.success("Shop video status updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["shop_videos"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update video status")
    }
  })

  // Save Video Mutation (Create/Update)
  const saveVideoMutation = useMutation({
    mutationFn: async (payload: { id?: string; internal_url: string; sort_order: number; is_active: boolean }) => {
      const url = payload.id ? `/api/shop-videos/${payload.id}` : `/api/shop-videos`
      const method = payload.id ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internal_url: payload.internal_url,
          sort_order: payload.sort_order,
          is_active: payload.is_active
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save video")
      return data
    },
    onSuccess: () => {
      toast.success(formMode === "create" ? "Shop video added successfully!" : "Shop video updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["shop_videos"] })
      setIsFormOpen(false)
      resetVideoForm()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save shop video")
    }
  })

  const videosList = videosData?.videos || []
  const videoTotalCount = videosData?.totalCount || 0
  const videoFrom = (videoPage - 1) * videoLimit
  const videoTo = videoFrom + videoLimit - 1

  // ── Video Form Actions ────────────────────────────────────────────────────
  const resetVideoForm = () => {
    reset({
      internal_url: "",
      sort_order: "0",
      is_active: true,
      upload_method: "url"
    })
    setVideoFile(null)
    setEditingVideo(null)
  }

  const handleEditVideoClick = (video: any) => {
    setFormMode("edit")
    setEditingVideo(video)
    reset({
      internal_url: video.internal_url || "",
      sort_order: video.sort_order !== undefined ? video.sort_order.toString() : "0",
      is_active: video.is_active !== false,
      upload_method: "url"
    })
    setVideoFile(null)
    setIsFormOpen(true)
  }

  // Cloudinary video upload API helper
  const uploadVideoFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload/video", {
      method: "POST",
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Video upload failed")
    return data.url
  }

  // Helper to inject Cloudinary optimization parameters if not already present
  const getOptimizedCloudinaryUrl = (url: string) => {
    if (!url || !url.includes("cloudinary.com")) return url
    if (url.includes("/f_auto,q_auto/")) return url
    return url.replace("/video/upload/", "/video/upload/f_auto,q_auto/")
  }

  const handleVideoFormSubmit = async (values: VideoFormValues) => {
    let finalUrl = values.internal_url

    if (values.upload_method === "file") {
      if (!videoFile && formMode === "create") {
        toast.error("Please select a video file to upload")
        return
      }

      if (videoFile) {
        setIsUploadingVideo(true)
        try {
          finalUrl = await uploadVideoFile(videoFile)
        } catch (err: any) {
          toast.error(err.message || "Failed to upload video file to Cloudinary")
          setIsUploadingVideo(false)
          return
        }
        setIsUploadingVideo(false)
      }
    } else {
      // Direct URL optimization check
      finalUrl = getOptimizedCloudinaryUrl(values.internal_url)
    }

    if (!finalUrl.trim()) {
      toast.error("Video URL is required")
      return
    }

    saveVideoMutation.mutate({
      id: editingVideo?.id,
      internal_url: finalUrl,
      sort_order: parseInt(values.sort_order.toString()) || 0,
      is_active: values.is_active
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={videoSearchValue}
            onChange={(e) => setVideoSearchValue(e.target.value)}
            placeholder="Search by video URL..."
            className="h-9 pl-9 text-xs font-medium border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg shadow-sm">
            <span className="text-xs font-semibold text-slate-500 capitalize tracking-wider">Status:</span>
            <Select value={videoStatusFilter} onValueChange={(val: any) => { setVideoStatusFilter(val); setVideoPage(1); }}>
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 text-xs gap-1.5">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-md">
                <SelectItem value="all" className="text-xs font-semibold">All Videos</SelectItem>
                <SelectItem value="active" className="text-xs font-semibold">Active Only</SelectItem>
                <SelectItem value="inactive" className="text-xs font-semibold">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => { resetVideoForm(); setFormMode("create"); setIsFormOpen(true); }}
            className="text-xs font-bold text-white bg-black hover:bg-black/90 shadow-sm h-9 px-4 rounded-lg flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" /> Add New Video
          </Button>
        </div>
      </div>

      {/* Videos Table Area */}
      <Table>
        <TableHeader className="bg-[#f8fafc]">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="w-12 text-center px-4">
              <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
            </TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600">Video Preview</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600">Internal Video URL</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600">Sort Order</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600">Created At</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600">Status</TableHead>
            <TableHead className="h-11 text-xs font-semibold text-slate-600 text-center px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isVideosLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="p-8 text-center text-xs font-semibold text-slate-400">
                Loading shop videos...
              </TableCell>
            </TableRow>
          ) : videosError ? (
            <TableRow>
              <TableCell colSpan={7} className="p-8 text-center text-xs font-semibold text-red-500">
                Error fetching shop videos. Please verify database connection.
              </TableCell>
            </TableRow>
          ) : videosList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="p-8 text-center text-xs font-semibold text-slate-400">
                No shop videos found matching current filters.
              </TableCell>
            </TableRow>
          ) : (
            videosList.map((video: any) => {
              const createdDate = video.created_at ? new Date(video.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'

              return (
                <TableRow key={video.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="w-12 text-center px-4">
                    <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="w-20 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm relative group cursor-pointer">
                      {video.internal_url ? (
                        <>
                          <video
                            src={video.internal_url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onMouseEnter={(e) => {
                              e.currentTarget.play().catch(() => { })
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause()
                              e.currentTarget.currentTime = 0
                            }}
                          />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center transition-opacity opacity-100 group-hover:opacity-0 pointer-events-none">
                            <PlayIcon className="h-4.5 w-4.5 text-white fill-white" />
                          </div>
                        </>
                      ) : (
                        <FileVideoIcon className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <a
                      href={video.internal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-slate-600 hover:text-black hover:underline truncate max-w-[280px] block"
                    >
                      {video.internal_url || '—'}
                    </a>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="text-[10px] font-bold text-slate-700 bg-slate-50 border-slate-200 rounded px-2 py-0.5">
                      #{video.sort_order !== undefined ? video.sort_order : 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">{createdDate}</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        checked={video.is_active !== false}
                        disabled={toggleVideoActiveMutation.isPending}
                        onCheckedChange={(checked) => {
                          toggleVideoActiveMutation.mutate({ id: video.id, is_active: checked })
                        }}
                      />
                      <span className={`text-[10px] font-bold capitalize tracking-wider ${video.is_active !== false ? "text-green-600" : "text-slate-400"
                        }`}>
                        {video.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditVideoClick(video)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        disabled={deleteVideoMutation.isPending}
                        onClick={() => handleDeleteVideo(video.id, video.internal_url)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Videos Pagination Footer */}
      <div className="bg-[#f8fafc] px-6 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
        <span className="text-[10px] font-bold text-slate-500">
          Showing {videoFrom + 1}-{Math.min(videoTo + 1, videoTotalCount)} of {videoTotalCount} videos
        </span>
        <div className="flex items-center gap-1">
          <Button
            disabled={videoPage === 1 || isVideosLoading}
            onClick={() => setVideoPage(prev => Math.max(prev - 1, 1))}
            variant="outline"
            size="icon"
            className="h-8 w-8 text-slate-600 border-slate-200 shadow-sm"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {(() => {
            const totalPages = Math.ceil(videoTotalCount / videoLimit) || 1
            const pages: (number | string)[] = []
            const range = 1

            for (let i = 1; i <= totalPages; i++) {
              if (
                i === 1 ||
                i === totalPages ||
                (i >= videoPage - range && i <= videoPage + range)
              ) {
                pages.push(i)
              } else if (
                i === videoPage - range - 1 ||
                i === videoPage + range + 1
              ) {
                pages.push('...')
              }
            }

            const filteredPages = pages.filter((item, index, self) => {
              return item !== '...' || self[index - 1] !== '...'
            })

            return filteredPages.map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={idx} className="text-xs font-bold text-slate-400 mx-1">
                    ...
                  </span>
                )
              }

              const isCurrent = page === videoPage
              return (
                <Button
                  key={idx}
                  onClick={() => setVideoPage(page as number)}
                  variant={isCurrent ? "outline" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 text-xs font-bold ${isCurrent
                    ? "bg-black text-white hover:bg-black/90 border-0 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {page}
                </Button>
              )
            })
          })()}

          <Button
            disabled={videoPage * videoLimit >= videoTotalCount || isVideosLoading}
            onClick={() => setVideoPage(prev => prev + 1)}
            variant="outline"
            size="icon"
            className="h-8 w-8 text-slate-600 border-slate-200 shadow-sm"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Delete Dialog */}
      <DeleteConfirmDialog
        isOpen={videoDeleteTarget !== null}
        onClose={() => setVideoDeleteTarget(null)}
        onConfirm={() => videoDeleteTarget && deleteVideoMutation.mutate(videoDeleteTarget.id)}
        itemName={videoDeleteTarget?.url ? (videoDeleteTarget.url.split('/').pop() || videoDeleteTarget.url) : undefined}
        title="Delete Shop Video"
        description="Are you sure you want to delete this shop video? It will be permanently removed from this list."
        isPending={deleteVideoMutation.isPending}
      />

      {/* Add/Edit Video Dialog Form */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open)
        if (!open) {
          resetVideoForm()
        }
      }}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {formMode === "create" ? "Add Shop Video" : "Edit Shop Video"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Provide a video source and configuration. Video uploads will be securely hosted and optimized on Cloudinary.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleVideoFormSubmit)} className="space-y-4 mt-4">
            {/* Video Source Option */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Video Source</Label>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200/50 w-full">
                <button
                  type="button"
                  onClick={() => setValue("upload_method", "url")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${uploadMethod === "url"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <LinkIcon className="h-3.5 w-3.5" /> Paste URL
                </button>
                <button
                  type="button"
                  onClick={() => setValue("upload_method", "file")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${uploadMethod === "file"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <UploadIcon className="h-3.5 w-3.5" /> Upload File
                </button>
              </div>
            </div>

            {/* Input Fields based on Source */}
            {uploadMethod === "url" ? (
              <div className="space-y-1.5">
                <Label htmlFor="video-url" className="text-xs font-bold text-slate-700">Video URL</Label>
                <Input
                  id="video-url"
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  {...register("internal_url")}
                  className="h-9 text-xs font-medium border-slate-200 focus-visible:ring-1 bg-slate-50/50 text-slate-900"
                  required={uploadMethod === "url"}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="video-file" className="text-xs font-bold text-slate-700">Video File</Label>
                <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/30 relative">
                  <input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setVideoFile(file)
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required={formMode === "create" && uploadMethod === "file"}
                  />
                  <FileVideoIcon className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    {videoFile ? videoFile.name : "Click or drag video file here"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {videoFile ? `Size: ${(videoFile.size / (1024 * 1024)).toFixed(2)} MB` : "MP4, WebM format"}
                  </p>
                </div>
                {formMode === "edit" && !videoFile && (
                  <p className="text-[10px] text-slate-500 truncate">
                    Current URL: <span className="font-semibold">{watch("internal_url")}</span>
                  </p>
                )}
              </div>
            )}

            {/* Sort Order */}
            <div className="space-y-1.5">
              <Label htmlFor="sort-order" className="text-xs font-bold text-slate-700">Sort Order</Label>
              <Input
                id="sort-order"
                type="number"
                min="0"
                placeholder="0"
                {...register("sort_order")}
                className="h-9 text-xs font-medium border-slate-200 focus-visible:ring-1 bg-slate-50/50 text-slate-900"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="is-active" className="text-xs font-bold text-slate-700">Is Active</Label>
                <span className="text-[10px] text-slate-400">Controls if this video displays on the storefront</span>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
            </div>

            {/* Footer Buttons */}
            <DialogFooter className="pt-4 flex justify-end gap-2 border-t border-slate-100 -mx-6 -mb-6 p-6 bg-slate-50/50 rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false)
                  resetVideoForm()
                }}
                disabled={saveVideoMutation.isPending || isUploadingVideo}
                className="h-9 text-xs font-bold border-slate-200 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveVideoMutation.isPending || isUploadingVideo}
                className="h-9 text-xs font-bold text-white bg-black hover:bg-black/90 shadow-sm flex items-center gap-1.5"
              >
                <span className={saveVideoMutation.isPending || isUploadingVideo ? "inline-flex" : "hidden"}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </span>
                <span>
                  {isUploadingVideo
                    ? "Uploading to Cloudinary..."
                    : saveVideoMutation.isPending
                      ? "Saving..."
                      : formMode === "create"
                        ? "Add Video"
                        : "Save Changes"}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
