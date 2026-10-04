import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDownIcon, TrashIcon, ExternalLink } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the editor with SSR disabled
const Editor = dynamic(() => import("@/components/ui/editor"), { ssr: false })

export interface GeneralTabProps {
  name: string
  setName: (v: string) => void
  slug: string
  setSlug: (v: string) => void
  description: string
  setDescription: (v: string) => void
  brandKey: string
  setBrandKey: (v: string) => void
  collectionKey: string
  setCollectionKey: (v: string) => void
  gender: string
  setGender: (v: string) => void
  materials: string
  setMaterials: (v: string) => void
  isLimitedEdition: boolean
  setIsLimitedEdition: (v: boolean) => void
  isNewArrival: boolean
  setIsNewArrival: (v: boolean) => void
  grouptype: string
  setGrouptype: (v: string) => void
  brandsList: { id: string; name: string }[]
  collectionsList: { id: string | number; name: string }[]
  groupsList: { id: string | number; heading: string }[]
  isActive: boolean
  setIsActive: (v: boolean) => void
  amazonUrl: string
  setAmazonUrl: (v: string) => void
  flipkartUrl: string
  setFlipkartUrl: (v: string) => void
}

export function GeneralTab({
  name,
  setName,
  slug,
  setSlug,
  description,
  setDescription,
  brandKey,
  setBrandKey,
  collectionKey,
  setCollectionKey,
  gender,
  setGender,
  materials,
  setMaterials,
  isLimitedEdition,
  setIsLimitedEdition,
  isNewArrival,
  setIsNewArrival,
  grouptype,
  setGrouptype,
  brandsList = [],
  collectionsList = [],
  groupsList = [],
  isActive,
  setIsActive,
  amazonUrl,
  setAmazonUrl,
  flipkartUrl,
  setFlipkartUrl,
}: GeneralTabProps) {



  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column */}
      <div className="md:col-span-2 space-y-6">
        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0f172a]">General Information</CardTitle>
            <p className="text-sm font-medium text-slate-500">Primary details for your listing.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Product Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Product Name"
                className="bg-white border-slate-200 font-semibold !text-black h-10 shadow-sm" 
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">URL Slug</label>
              <div className="flex shadow-sm rounded-md">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm font-medium">
                  markline.in/
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
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Description</label>
              <div className="shadow-sm">
                <Editor
                  value={description}
                  onChange={setDescription}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0f172a]">Specifications & Materials</CardTitle>
            <p className="text-sm font-medium text-slate-500">Classification, categories and dynamic attributes.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Brand</label>
              <div className="relative">
                <select 
                  value={brandKey}
                  onChange={(e) => setBrandKey(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 text-sm font-semibold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" className="!text-black">None</option>
                  {brandsList.map((brand) => (
                    <option key={brand.id} value={brand.id} className="!text-black">
                      {brand.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Collection</label>
              <div className="relative">
                <select 
                  value={collectionKey}
                  onChange={(e) => setCollectionKey(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 text-sm font-semibold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" className="!text-black">None</option>
                  {collectionsList.map((col) => (
                    <option key={col.id} value={String(col.id)} className="!text-black">
                      {col.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Gender</label>
              <div className="relative">
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 text-sm font-semibold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Men" className="!text-black">Men</option>
                  <option value="Women" className="!text-black">Women</option>
                  <option value="Kids" className="!text-black">Kids</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Content Group (Group Type)</label>
              <div className="relative">
                <select 
                  value={grouptype}
                  onChange={(e) => setGrouptype(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 text-sm font-semibold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" className="!text-black">None</option>
                  {groupsList.map((g) => (
                    <option key={g.id} value={String(g.id)} className="!text-black">
                      {g.heading}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-4">
              <div className="mb-3">
                <label className="text-[11px] font-bold text-slate-700 block capitalize tracking-wide">Materials Used</label>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Specify materials used for the product using the editor below.</p>
              </div>
              <div className="shadow-sm">
                <Editor
                  value={materials}
                  onChange={setMaterials}
                  height={250}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace & Referral Links */}
        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0f172a]">Marketplace & Referral Links</CardTitle>
            <p className="text-sm font-medium text-slate-500">External marketplace referral links for Amazon and Flipkart.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#ff9900]"></span>
                  Amazon URL
                </label>
                {amazonUrl && (
                  <a
                    href={amazonUrl.startsWith('http') ? amazonUrl : `https://${amazonUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                  >
                    Test Link <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <Input
                value={amazonUrl}
                onChange={(e) => setAmazonUrl(e.target.value)}
                placeholder="https://www.amazon.in/dp/..."
                className="bg-white border-slate-200 font-semibold !text-black h-10 shadow-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">Direct product referral link on Amazon</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#2874f0]"></span>
                  Flipkart URL
                </label>
                {flipkartUrl && (
                  <a
                    href={flipkartUrl.startsWith('http') ? flipkartUrl : `https://${flipkartUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                  >
                    Test Link <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <Input
                value={flipkartUrl}
                onChange={(e) => setFlipkartUrl(e.target.value)}
                placeholder="https://www.flipkart.com/..."
                className="bg-white border-slate-200 font-semibold !text-black h-10 shadow-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">Direct product referral link on Flipkart</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Active Toggle Status Card */}
        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0f172a]">Publish Status</CardTitle>
            <p className="text-xs font-medium text-slate-500">Control if this product is active on the storefront.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Product Active</span>
              <div 
                onClick={() => setIsActive(!isActive)}
                className={`w-9 h-5 rounded-full flex items-center p-0.5 cursor-pointer border transition-colors ${isActive ? 'bg-blue-600 border-blue-600 justify-end' : 'bg-slate-200 border-slate-300 justify-start'}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0f172a]">Badges</CardTitle>
            <p className="text-xs font-medium text-slate-500">Storefront marketing labels.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Limited Edition</span>
              <div 
                onClick={() => setIsLimitedEdition(!isLimitedEdition)}
                className={`w-9 h-5 rounded-full flex items-center p-0.5 cursor-pointer border ${isLimitedEdition ? 'bg-blue-600 border-blue-600 justify-end' : 'bg-slate-200 border-slate-300 justify-start'}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                  {isLimitedEdition && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">New Arrival</span>
              <div 
                onClick={() => setIsNewArrival(!isNewArrival)}
                className={`w-9 h-5 rounded-full flex items-center p-0.5 cursor-pointer border ${isNewArrival ? 'bg-blue-600 border-blue-600 justify-end' : 'bg-slate-200 border-slate-300 justify-start'}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                  {isNewArrival && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
