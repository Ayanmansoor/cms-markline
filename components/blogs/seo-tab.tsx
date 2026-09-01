import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MonitorIcon, SmartphoneIcon } from "lucide-react"

export function BlogSeoTab() {
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [slug, setSlug] = useState("")

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column */}
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
                placeholder="Enter SEO title..."
                className="bg-white border-slate-200 font-semibold text-slate-900 h-10 shadow-sm"
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
                  placeholder="url-slug"
                  className="rounded-l-none border-slate-200 font-semibold text-slate-900 h-10 shadow-none focus-visible:z-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
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
              {seoTitle || "New Blog Post"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
              {seoDescription || "No description provided."}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-[#f8fafc]">
          <CardHeader className="py-3 px-4 border-b border-slate-200 bg-white rounded-t-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Social Sharing Preview</span>
          </CardHeader>
          <CardContent className="p-4 bg-white rounded-b-2xl">
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <div className="h-32 bg-slate-900 flex items-center justify-center border-b border-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800"></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-slate-500 z-10">
                  <path d="M19 12l-2-2-5 3-4-2c-1.7 0-3 1.3-3 3v1h14l4-3z"></path>
                  <path d="M14 10l-1-2-2 1"></path>
                </svg>
              </div>
              <div className="p-3 bg-slate-50">
                <p className="text-[10px] text-slate-500 uppercase mb-1">markline.com</p>
                <p className="text-sm font-bold text-slate-900 leading-tight mb-1 truncate">
                  {seoTitle || "New Blog Post"}
                </p>
                <p className="text-[11px] text-slate-600 line-clamp-1">
                  {seoDescription || "No description provided."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-8 text-xs font-bold text-slate-600 bg-white">Facebook</Button>
              <Button variant="outline" className="flex-1 h-8 text-xs font-bold text-slate-600 bg-white">X / Twitter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
