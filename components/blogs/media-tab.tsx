import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloudIcon, ImagePlusIcon, Trash2Icon } from "lucide-react"

export function BlogMediaTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      
      {/* Banner Image */}
      <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
        <CardHeader className="pb-4 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-[#0f172a]">Banner Image</CardTitle>
          <p className="text-xs font-medium text-slate-500">The main image displayed at the top of the blog post. Recommended size: 1200 x 630px.</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-8 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group mb-4">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloudIcon className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF (max. 800x400px)</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="flex-1 text-xs font-bold border-slate-200 text-slate-700 bg-white">
                <ImagePlusIcon className="h-4 w-4 mr-2" /> Browse Library
             </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card Image */}
      <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white overflow-hidden">
        <CardHeader className="pb-4 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-[#0f172a]">Card Image</CardTitle>
          <p className="text-xs font-medium text-slate-500">The thumbnail displayed on blog listing pages. Recommended size: 600 x 400px.</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 mb-4 relative group">
             {/* Placeholder for uploaded card image */}
             <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800"></div>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full p-16 text-slate-500 z-10 opacity-50 relative">
                <path d="M19 12l-2-2-5 3-4-2c-1.7 0-3 1.3-3 3v1h14l4-3z"></path>
                <path d="M14 10l-1-2-2 1"></path>
             </svg>
             <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-md">
                   <Trash2Icon className="h-4 w-4" />
                </Button>
             </div>
          </div>
          <div className="flex gap-3">
             <Button className="flex-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white">
                Replace Image
             </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
