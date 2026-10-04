"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import React from "react"
import { BrandGeneralTab } from "@/components/brands/general-tab"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

import { useState } from "react"

interface BrandFormValues {
  name: string
  sinceYear: string
  description: string
  gender: string
  imageUrl: string
  discountKey: string
  isActive: boolean
}

const defaultFormValues: BrandFormValues = {
  name: "",
  sinceYear: "",
  description: "",
  gender: "men",
  imageUrl: "",
  discountKey: "",
  isActive: false,
}

export default function EditBrandPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()

  const { register, watch, setValue, reset, getValues } = useForm<BrandFormValues>({
    defaultValues: defaultFormValues,
  })

  // Local state for deferred GitHub uploads
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url")
  const [isUploading, setIsUploading] = useState(false)
  const [localFile, setLocalFile] = useState<File | null>(null)

  // GitHub Folders State
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [isFoldersLoading, setIsFoldersLoading] = useState(false)

  const name = watch("name")
  const sinceYear = watch("sinceYear")
  const description = watch("description")
  const gender = watch("gender")
  const imageUrl = watch("imageUrl")
  const discountKey = watch("discountKey")
  const isActive = watch("isActive")

  // Fetch brand data
  const { data: brandResponse, isLoading: isBrandLoading } = useQuery({
    queryKey: ["brand", id],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${id}`)
      if (!res.ok) throw new Error("Failed to fetch brand details")
      return res.json()
    },
    enabled: !!id,
  })

  // Populating the fields when the brand details are fetched
  useEffect(() => {
    if (brandResponse?.success && brandResponse.brand) {
      const b = brandResponse.brand
      let sinceYearVal = ""
      if (b.since_year) {
        try {
          const year = new Date(b.since_year).getFullYear()
          sinceYearVal = isNaN(year) ? "" : String(year)
        } catch {
          sinceYearVal = ""
        }
      }
      reset({
        name: b.name || "",
        description: b.description || "",
        gender: b.gender ? b.gender.toLowerCase() : "men",
        imageUrl: b.image_url || "",
        discountKey: b.discount_key || "",
        sinceYear: sinceYearVal,
        isActive: b.isActive ?? b.is_active ?? false,
      })
    }
  }, [brandResponse, reset])

  // Fetch available folders in the GitHub repository on mount
  useEffect(() => {
    async function loadFolders() {
      setIsFoldersLoading(true)
      try {
        const res = await fetch("/api/upload/folders")
        if (res.ok) {
          const data = await res.json()
          if (data.folders) {
            setFolders(data.folders)
            if (data.folders.length > 0) {
              setSelectedFolder(data.folders[0])
            }
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

  // Auto-routing folder logic based on filename
  const autoRouteFolder = (filename: string) => {
    if (folders.length === 0) return
    const filenameLower = filename.toLowerCase()
    let bestMatch = ""
    let maxScore = 0

    for (const folderPath of folders) {
      const parts = folderPath.toLowerCase().split('/')
      const folderName = parts[parts.length - 1]
      const keywords = folderName.split(/[-_\s]/).filter(word => word.length > 2)
      keywords.push(folderName)

      let score = 0
      for (const word of keywords) {
        if (filenameLower.includes(word)) {
          score += word.length
        }
      }

      if (score > maxScore) {
        maxScore = score
        bestMatch = folderPath
      }
    }

    if (maxScore > 0 && bestMatch) {
      setSelectedFolder(bestMatch)
      toast.info(`Auto-routed to folder: "${bestMatch}"`)
    }
  }

  // Handle local File selections (Thumbnail)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLocalFile(file)
    autoRouteFolder(file.name)
    const localUrl = URL.createObjectURL(file)
    setValue("imageUrl", localUrl)
  }

  // React Query: Fetch discounts with caching
  const { data: discountsData } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => {
      const res = await fetch("/api/discounts")
      if (!res.ok) throw new Error("Failed to fetch discounts")
      return res.json()
    }
  })

  const discounts = discountsData?.success && Array.isArray(discountsData.discounts)
    ? discountsData.discounts.map((d: any) => ({
      id: d.id,
      name: d.name,
      percentage: d.percentage || "",
    }))
    : []

  // React Query: Update Brand Mutation
  const updateBrandMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/brands/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update brand")
      }
      return data
    },
    onSuccess: () => {
      toast.success("Brand updated successfully! Task is complete")
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brand", id] })
      router.push("/brands")
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while saving brand")
    }
  })

  const handleSave = async () => {
    const v = getValues()

    if (!v.name.trim()) {
      toast.error("Brand Name is required!")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading("Processing brand logo upload...")

    try {
      let finalImageUrl = v.imageUrl.trim()

      // 1. Upload local logo file to GitHub sequentially if selected
      if (uploadMethod === "file" && localFile) {
        const formData = new FormData()
        formData.append("file", localFile)
        if (selectedFolder) {
          formData.append("folder", selectedFolder)
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Logo upload failed")

        if (finalImageUrl.startsWith("blob:")) {
          URL.revokeObjectURL(finalImageUrl)
        }
        finalImageUrl = data.url
      }

      // Formulate since_year as date (YYYY-01-01) or null
      let sinceYearDate = null
      if (v.sinceYear.trim()) {
        const year = parseInt(v.sinceYear.trim())
        if (!isNaN(year)) {
          sinceYearDate = `${year}-01-01`
        }
      }

      const payload = {
        name: v.name.trim(),
        description: v.description.trim(),
        image_url: finalImageUrl || null,
        since_year: sinceYearDate,
        gender: v.gender,
        discount_key: v.discountKey || null,
        isActive: !!v.isActive,
      }

      toast.loading("Saving updated brand details...", { id: toastId })
      updateBrandMutation.mutate(payload)
    } catch (err: any) {
      toast.error(err.message || "Failed to process logo upload", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const isLoading = isBrandLoading || updateBrandMutation.isPending || isUploading

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-white flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-5 pt-6 flex flex-col justify-between">
          <div>
            <div className="w-full flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
              <div>
                <div className="flex items-center text-xs text-slate-500 mb-1">
                  <span className="hover:text-slate-900 cursor-pointer" onClick={() => router.push("/brands")}>Brands</span>
                  <span className="mx-1">{'>'}</span>
                  <span className="font-bold text-slate-900">Edit Brand</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Edit Brand</h1>
              </div>
            </div>

            <div className="w-full outline-none rounded-lg border p-5">
              {isBrandLoading ? (
                <div className="text-sm font-medium text-slate-500 py-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
                  Loading brand details...
                </div>
              ) : (
                <BrandGeneralTab
                  name={name}
                  setName={(v) => setValue("name", v)}
                  sinceYear={sinceYear}
                  setSinceYear={(v) => setValue("sinceYear", v)}
                  description={description}
                  setDescription={(v) => setValue("description", v)}
                  gender={gender}
                  setGender={(v) => setValue("gender", v)}
                  imageUrl={imageUrl}
                  setImageUrl={(v) => setValue("imageUrl", v)}
                  discountKey={discountKey}
                  setDiscountKey={(v) => setValue("discountKey", v)}
                  discountsList={discounts}
                  uploadMethod={uploadMethod}
                  setUploadMethod={setUploadMethod}
                  setLocalFile={setLocalFile}
                  folders={folders}
                  selectedFolder={selectedFolder}
                  setSelectedFolder={setSelectedFolder}
                  isFoldersLoading={isFoldersLoading}
                  handleFileChange={handleFileChange}
                  isActive={isActive}
                  setIsActive={(v) => setValue("isActive", v)}
                />
              )}
            </div>
          </div>


        </div>
        <div className="mt-8 px-5 -mb-5 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200 bg-white sticky bottom-0 z-30 shadow-md">
          <Button
            variant="outline"
            onClick={() => router.push("/brands")}
            disabled={isLoading}
            className="font-bold text-slate-700 border-slate-300 bg-white hover:bg-slate-50 px-6 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="font-bold bg-black text-white hover:bg-black/90 px-6 shadow-sm cursor-pointer"
          >
            {isLoading ? "Saving..." : "Save Brand"}
          </Button>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
