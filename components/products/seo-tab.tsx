import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MonitorIcon, SmartphoneIcon, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface SeoTabProps {
  seoTitle: string
  setSeoTitle: (v: string) => void
  seoDescription: string
  setSeoDescription: (v: string) => void
  slug: string
  setSlug: (v: string) => void
  keywords: string[]
  setKeywords: (v: string[]) => void
}

export function SeoTab({
  seoTitle,
  setSeoTitle,
  seoDescription,
  setSeoDescription,
  slug,
  setSlug,
  keywords = [],
  setKeywords
}: SeoTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column */}
      <div className="md:col-span-2 space-y-6">
        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0f172a]">Search Engine Optimization</CardTitle>
            <p className="text-sm font-medium text-slate-500">Optimize how this footwear product appears in search engine results.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-700">SEO Title</label>
                <span className="text-[10px] font-bold text-slate-400">{seoTitle.length} / 60 CHARACTERS</span>
              </div>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO Title"
                className="bg-white border-slate-200 font-semibold !text-black h-10 shadow-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 italic">The title that appears in search results and browser tabs.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-700">Meta Description</label>
                <span className="text-[10px] font-bold text-slate-400">{seoDescription.length} / 160 CHARACTERS</span>
              </div>
              <textarea
                className="w-full h-24 p-3 text-sm font-semibold !text-black bg-white border border-slate-200 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta Description"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 italic">A clear, concise summary of the product to encourage clicks.</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">URL Slug</label>
              <div className="flex shadow-sm rounded-md">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm font-medium">
                  markline.com/p/
                </span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="slug"
                  className="rounded-l-none border-slate-200 font-semibold !text-black h-10 shadow-none focus-visible:z-10"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">SEO Keywords</label>
              <Input
                placeholder="Type a keyword and press Enter..."
                className="bg-white border-slate-200 font-semibold !text-black h-10 shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const val = e.currentTarget.value.trim()
                    if (val) {
                      if (!keywords.includes(val)) {
                        setKeywords([...keywords, val])
                      }
                      e.currentTarget.value = ""
                    }
                  }
                }}
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {keywords.map((kw, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border-none">
                    {kw}
                    <button
                      type="button"
                      onClick={() => setKeywords(keywords.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-slate-600 transition-colors ml-0.5 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-[#f8fafc]">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-200 bg-white rounded-t-2xl">
            <span className="text-[10px] font-bold text-slate-500 capitalize tracking-wider">Search Engine Preview</span>
            <div className="flex gap-2">
              <MonitorIcon className="h-4 w-4 text-slate-400" />
              <SmartphoneIcon className="h-4 w-4 text-slate-300" />
            </div>
          </CardHeader>
          <CardContent className="p-4 bg-white rounded-b-2xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">M</div>
              <div>
                <p className="text-[11px] font-medium text-slate-800 leading-none">Markline</p>
                <p className="text-[10px] text-slate-500">https://markline.com › products › {slug || '...'}</p>
              </div>
            </div>
            <h3 className="text-lg font-medium text-[#1a0dab] leading-tight mb-1 cursor-pointer hover:underline">{seoTitle || "Product Title"}</h3>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{seoDescription || "Provide a meta description..."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
