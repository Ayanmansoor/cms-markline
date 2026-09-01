"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EyeIcon, LinkIcon, CopyIcon, CalendarIcon, ClockIcon, XIcon, TrashIcon, ChevronDownIcon, FolderIcon, MonitorIcon, SmartphoneIcon } from "lucide-react"
import React, { useState, useEffect, useRef } from "react"
import TinyMCEEditor from "@/components/ui/editor"
import { RelationsPanel } from "@/components/blogs/relations-panel"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function CreateBlogPage() {
  const router = useRouter()

  // ── Content field state ────────────────────────────────────────────────────
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [content, setContent] = useState("")
  const [description, setDescription] = useState("")
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [selectedProducts, setSelectedProducts] = useState<{ id: number; name: string }[]>([])
  const [selectedBlogs, setSelectedBlogs] = useState<{ id: number; title: string }[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // ── Image upload state ─────────────────────────────────────────────────────
  const [bannerImageUrl, setBannerImageUrl] = useState("")
  const [bannerUploadMethod, setBannerUploadMethod] = useState<"url" | "file">("url")
  const [bannerLocalFile, setBannerLocalFile] = useState<File | null>(null)

  const [cardImageUrl, setCardImageUrl] = useState("")
  const [cardUploadMethod, setCardUploadMethod] = useState<"url" | "file">("url")
  const [cardLocalFile, setCardLocalFile] = useState<File | null>(null)

  // ── GitHub folder state ────────────────────────────────────────────────
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [isFoldersLoading, setIsFoldersLoading] = useState(false)

  // Auto-generate slug and seoTitle from title
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
    }
    if (!seoTitle) {
      setSeoTitle(value)
    }
  }

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

  // Auto-route folder based on filename
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
    if (maxScore > 0 && bestMatch) setSelectedFolder(bestMatch)
  }

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerLocalFile(file)
    setBannerImageUrl(URL.createObjectURL(file))
    autoRouteFolder(file.name)
  }

  const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCardLocalFile(file)
    setCardImageUrl(URL.createObjectURL(file))
    autoRouteFolder(file.name)
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const trimmed = tagInput.trim().toLowerCase()
      if (trimmed && !tags.includes(trimmed)) {
        setTags(prev => [...prev, trimmed])
      }
      setTagInput("")
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  // ── Upload a local file to GitHub storage and return CDN URL ──────────────
  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", selectedFolder)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || "Image upload failed")
    }
    const data = await res.json()
    return data.url as string
  }

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async (publishStatus: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      toast.error("Title is required before saving.")
      return
    }

    setIsSaving(true)
    const toastId = "blog-save"
    toast.loading("Saving blog post...", { id: toastId })

    try {
      // Upload images if local files were chosen
      let finalBannerUrl = bannerLocalFile ? null : bannerImageUrl
      let finalCardUrl = cardLocalFile ? null : cardImageUrl

      if (bannerLocalFile) {
        toast.loading("Uploading banner image...", { id: toastId })
        finalBannerUrl = await uploadFile(bannerLocalFile)
      }
      if (cardLocalFile) {
        toast.loading("Uploading card image...", { id: toastId })
        finalCardUrl = await uploadFile(cardLocalFile)
      }

      toast.loading("Creating blog post...", { id: toastId })
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          content,
          description: description.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
          bannerImage: finalBannerUrl || undefined,
          image: finalCardUrl || undefined,
          status: publishStatus,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create blog post")
      }

      // Sync relations if any are selected
      if (selectedProducts.length > 0 || selectedBlogs.length > 0) {
        toast.loading("Linking related products and blogs...", { id: toastId })
        const relRes = await fetch(`/api/blogs/${result.blog.id}/relations`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: selectedProducts.map(p => p.id),
            relatedBlogIds: selectedBlogs.map(b => b.id),
          })
        })
        if (!relRes.ok) {
          const relData = await relRes.json().catch(() => ({}))
          throw new Error(relData.error || "Failed to sync related products/blogs")
        }
      }

      toast.success(
        publishStatus === "PUBLISHED" ? "Blog published successfully!" : "Blog saved as draft!",
        { id: toastId }
      )

      // Navigate to the edit page for the newly created blog
      router.push(`/blogs`)
    } catch (err: any) {
      toast.error(err.message || "Something went wrong", { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  // SEO Score calculation
  const seoScoreVal = (() => {
    let score = 50
    if (title && title.length > 30 && title.length < 70) score += 15
    if (description) score += 15
    if (seoDescription) score += 10
    if (bannerImageUrl || cardImageUrl) score += 10
    return score
  })()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb] flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        <div className="flex-1 overflow-y-auto p-8">

          {/* Page Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <span>EDITOR</span>
                <span className="text-slate-300">&gt;</span>
                <span className="text-blue-600">Add Post</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">New Blog Post</h1>
            </div>
            <Button variant="outline" className="text-xs font-bold text-slate-700 border-slate-300 bg-white hover:bg-slate-50">
              <EyeIcon className="h-4 w-4 mr-2 text-slate-500" /> Preview
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="content" className="w-full">
            <div className="border-b border-slate-200 mb-6">
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-8 justify-start rounded-none">
                <TabsTrigger value="content" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Content</TabsTrigger>
                <TabsTrigger value="media" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Media</TabsTrigger>
                <TabsTrigger value="seo" className="!bg-transparent !shadow-none data-[state=active]:!text-blue-700 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">SEO</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

                {/* Left Column - Main Content */}
                <div className="space-y-6">

                  {/* Title Card */}
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">POST TITLE</Label>
                        <Input
                          value={title}
                          onChange={e => handleTitleChange(e.target.value)}
                          placeholder="Enter post title..."
                          className="h-10 text-sm font-medium border-slate-200 text-slate-900"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <LinkIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex items-center flex-1 bg-slate-50 rounded-md border border-slate-200 px-3 py-2">
                          <span className="text-xs text-slate-500 mr-1">markline.com/blog/</span>
                          <input
                            type="text"
                            value={slug}
                            onChange={e => setSlug(e.target.value)}
                            placeholder="url-slug"
                            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 flex-1 min-w-0"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 shrink-0">
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rich Text Editor Card */}
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white">
                      {/* Placeholder Toolbar matching TinyMCE to look consistent if the component hasn't loaded yet, but TinyMCE will override its own interior. 
                          The design shows standard bold/italic tools and word count. */}
                      <span className="text-[11px] font-medium text-slate-500 ml-auto">0 words</span>
                    </div>
                    <div>
                      {/* Using the TinyMCEEditor component */}
                      <TinyMCEEditor
                        value={content}
                        onChange={setContent}
                        height={500}
                      />
                    </div>
                  </Card>

                </div>

                {/* Right Column - Sidebar Widgets */}
                <div className="space-y-6">

                  {/* Publishing */}
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xs font-bold text-slate-900">Publishing</h3>
                        <Badge variant="secondary" className="text-[9px] font-bold text-slate-600 bg-slate-100 uppercase tracking-wider rounded-md">DRAFT</Badge>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-500">
                            <EyeIcon className="h-4 w-4" />
                            <span className="text-xs font-semibold">Visibility</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900">Public</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-500">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="text-xs font-semibold">Schedule</span>
                          </div>
                          <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">Set Date</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-slate-400">
                        <ClockIcon className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-medium">Last saved today at 10:45 AM</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
                    <CardContent className="p-5">
                      <h3 className="text-xs font-bold text-slate-900 mb-4">Tags</h3>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">ADD TAGS</Label>

                      {/* Tag chips + input inline */}
                      <div className="min-h-[38px] flex flex-wrap gap-1.5 items-center px-2.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-bold shrink-0"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <XIcon className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder={tags.length === 0 ? "Type a tag and press Enter..." : "Add more..."}
                          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-medium text-slate-700 placeholder:text-slate-400"
                        />
                      </div>

                      <p className="mt-2 text-[10px] text-slate-400 font-medium">
                        Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold">Enter</kbd> or <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold">,</kbd> to add a tag. Backspace removes last tag.
                      </p>

                      {tags.length > 0 && (
                        <p className="mt-2 text-[10px] text-slate-500 font-semibold">{tags.length} tag{tags.length > 1 ? "s" : ""} added</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Related Products & Blogs */}
                  <RelationsPanel
                    selectedProducts={selectedProducts}
                    selectedBlogs={selectedBlogs}
                    onProductsChange={setSelectedProducts}
                    onBlogsChange={setSelectedBlogs}
                  />

                </div>

              </div>
            </TabsContent>

            {/* Media Tab — Image Uploads */}
            <TabsContent value="media" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
              <div className=" mx-auto space-y-6">

                {/* GitHub Storage Directory */}
                <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                      <FolderIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">GitHub Storage Directory</p>
                      <p className="text-[11px] text-slate-400 font-semibold">Select the folder where uploaded images will be saved.</p>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedFolder}
                      disabled={isFoldersLoading}
                      onChange={e => setSelectedFolder(e.target.value)}
                      className="w-full h-10 pl-3 pr-10 text-sm font-bold !text-black border border-slate-200 rounded-lg bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isFoldersLoading ? (
                        <option value="">Fetching folders...</option>
                      ) : (
                        <>
                          <option value="" className="!text-black">/ (Repository Root)</option>
                          {folders.map(f => (
                            <option key={f} value={f} className="!text-black">{f}</option>
                          ))}
                        </>
                      )}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Banner Image */}
                <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Banner Image</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">The main image displayed at the top of the blog post.</p>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBannerUploadMethod("url")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${bannerUploadMethod === "url"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        Paste URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerUploadMethod("file")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${bannerUploadMethod === "file"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        Upload File
                      </button>
                    </div>

                    {bannerUploadMethod === "url" ? (
                      <Input
                        value={bannerImageUrl}
                        onChange={e => setBannerImageUrl(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="h-10 text-sm font-semibold border-slate-200 !text-black bg-white"
                      />
                    ) : (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileChange}
                        className="h-10 text-sm font-semibold border-slate-200 text-slate-900 cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                    )}

                    {bannerImageUrl && (
                      <div className="relative border border-slate-200 rounded-xl overflow-hidden">
                        <img
                          src={bannerImageUrl}
                          alt="Banner Preview"
                          className="w-full aspect-video object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/900x506?text=Invalid+URL" }}
                        />
                        <button
                          type="button"
                          onClick={() => { setBannerImageUrl(""); setBannerLocalFile(null) }}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Card / Thumbnail Image */}
                <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Card Image</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">The thumbnail displayed on blog listing pages.</p>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCardUploadMethod("url")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${cardUploadMethod === "url"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        Paste URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardUploadMethod("file")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${cardUploadMethod === "file"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        Upload File
                      </button>
                    </div>

                    {cardUploadMethod === "url" ? (
                      <Input
                        value={cardImageUrl}
                        onChange={e => setCardImageUrl(e.target.value)}
                        placeholder="https://example.com/thumbnail.jpg"
                        className="h-10 text-sm font-semibold border-slate-200 !text-black bg-white"
                      />
                    ) : (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleCardFileChange}
                        className="h-10 text-sm font-semibold border-slate-200 text-slate-900 cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                    )}

                    {cardImageUrl && (
                      <div className="relative border border-slate-200 rounded-xl overflow-hidden">
                        <img
                          src={cardImageUrl}
                          alt="Card Thumbnail Preview"
                          className="w-full aspect-video object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/900x506?text=Invalid+URL" }}
                        />
                        <button
                          type="button"
                          onClick={() => { setCardImageUrl(""); setCardLocalFile(null) }}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </TabsContent>
            {/* SEO Tab */}
            <TabsContent value="seo" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
              <div className="grid gap-6 md:grid-cols-3">

                {/* Left Column - SEO Inputs */}
                <div className="md:col-span-2 space-y-6">
                  <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold text-[#0f172a]">Search Engine Optimization</CardTitle>
                      <p className="text-sm font-medium text-slate-500">Optimize how this blog post appears in search engine results.</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] font-bold text-slate-700">SEO Title</label>
                          <span className="text-[10px] font-bold text-slate-400">{seoTitle.length} / 60 CHARACTERS</span>
                        </div>
                        <Input
                          value={seoTitle}
                          onChange={e => setSeoTitle(e.target.value)}
                          className="bg-white border-slate-200 font-semibold text-slate-900 h-10 shadow-sm"
                          placeholder="Enter SEO title..."
                        />
                        <p className="text-[11px] text-slate-500 mt-1.5 italic">The title that appears in search results and browser tabs.</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] font-bold text-slate-700">Meta Description</label>
                          <span className="text-[10px] font-bold text-slate-400">{seoDescription.length} / 160 CHARACTERS</span>
                        </div>
                        <textarea
                          value={seoDescription}
                          onChange={e => setSeoDescription(e.target.value)}
                          placeholder="Enter meta description..."
                          className="w-full h-24 p-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-1.5 italic">A clear, concise summary of the post to encourage clicks.</p>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">URL Slug</label>
                        <div className="flex shadow-sm rounded-md">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm font-medium">
                            markline.com/blog/
                          </span>
                          <Input
                            value={slug}
                            onChange={e => setSlug(e.target.value)}
                            className="rounded-l-none border-slate-200 font-semibold text-slate-900 h-10 shadow-none focus-visible:z-10"
                            placeholder="url-slug"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Previews & SEO Score */}
                <div className="space-y-6">
                  {/* Google Search Card Preview */}
                  <Card className="shadow-sm border border-slate-200 rounded-2xl bg-[#f8fafc]">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-200 bg-white rounded-t-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Engine Preview</span>
                      <div className="flex gap-2">
                        <MonitorIcon className="h-4 w-4 text-slate-400" />
                        <SmartphoneIcon className="h-4 w-4 text-slate-300" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-white rounded-b-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">M</div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-800 leading-none">Markline Global</p>
                          <p className="text-[10px] text-slate-500">https://markline.com › blog › {slug || "..."}</p>
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-[#1a0dab] leading-tight mb-1 cursor-pointer hover:underline">
                        {seoTitle || title || "Untitled Blog Post"}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {seoDescription || description || "No description provided."}
                      </p>
                    </CardContent>
                  </Card>

                  {/* SEO Score Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white text-center p-4">
                      <p className="text-3xl font-black text-blue-600 mb-1">{seoScoreVal}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SEO Score</p>
                    </Card>
                    <Card className="shadow-sm border border-emerald-200 rounded-2xl bg-white text-center p-4">
                      <p className="text-3xl font-black text-emerald-500 mb-1 flex items-center justify-center gap-1">
                        <span className="text-sm">✓</span>0
                      </p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Errors Found</p>
                    </Card>
                  </div>
                </div>

              </div>
            </TabsContent>
            <TabsContent value="settings" forceMount className="data-[state=inactive]:hidden"><div className="p-8 text-center text-slate-500">Advanced settings will appear here.</div></TabsContent>
          </Tabs>

        </div>

        {/* Action Bar */}
        <div className="bg-white border-t border-slate-200 py-4 px-8 flex items-center justify-end shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-500 mr-2">
              <ClockIcon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Last saved 2 minutes ago</span>
            </div>
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => handleSave("DRAFT")}
              className="h-9 text-xs font-bold text-slate-700 hover:text-black cursor-pointer transition-all border border-slate-300 bg-white hover:bg-slate-100 px-5"
            >
              {isSaving ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => handleSave("PUBLISHED")}
              className="h-9 text-xs cursor-pointer font-bold text-white bg-black hover:bg-black/90 px-5"
            >
              {isSaving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

      </SidebarInset>
    </SidebarProvider>
  )
}
