"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDownIcon, UploadCloud, TrashIcon } from "lucide-react"
import dynamic from "next/dynamic"
import React from "react"

// Dynamically import the editor with SSR disabled
const Editor = dynamic(() => import("@/components/ui/editor"), { ssr: false })

export interface BrandGeneralTabProps {
  name: string
  setName: (v: string) => void
  sinceYear: string
  setSinceYear: (v: string) => void
  description: string
  setDescription: (v: string) => void
  gender: string
  setGender: (v: string) => void
  imageUrl: string
  setImageUrl: (v: string) => void
  discountKey: string
  setDiscountKey: (v: string) => void
  discountsList?: { id: string; name: string; percentage: string }[]
  uploadMethod: "url" | "file"
  setUploadMethod: (v: "url" | "file") => void
  setLocalFile: (file: File | null) => void
  folders: string[]
  selectedFolder: string
  setSelectedFolder: (v: string) => void
  isFoldersLoading: boolean
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function BrandGeneralTab({
  name,
  setName,
  sinceYear,
  setSinceYear,
  description,
  setDescription,
  gender,
  setGender,
  imageUrl,
  setImageUrl,
  discountKey,
  setDiscountKey,
  discountsList = [],
  uploadMethod,
  setUploadMethod,
  setLocalFile,
  folders,
  selectedFolder,
  setSelectedFolder,
  isFoldersLoading,
  handleFileChange,
}: BrandGeneralTabProps) {

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column */}
      <div className="md:col-span-2 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Brand Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AURORA STEPS"
              className="bg-white border-slate-200 h-10 text-sm font-semibold shadow-sm !text-black"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Established Year (YYYY)</label>
            <Input
              value={sinceYear}
              onChange={(e) => setSinceYear(e.target.value)}
              placeholder="e.g. 2014"
              className="bg-white border-slate-200 h-10 text-sm font-semibold shadow-sm !text-black"
            />
          </div>
        </div>

        {/* GitHub Storage Directory Selector */}
        <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                <ChevronDownIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">GitHub Storage Directory</p>
                <p className="text-[10px] text-slate-400 font-semibold">Select the target folder in the GitHub repository.</p>
              </div>
            </div>
            <div className="w-full sm:w-60 relative">
              <select
                value={selectedFolder}
                disabled={isFoldersLoading}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs font-bold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {isFoldersLoading ? (
                  <option value="">Fetching folders...</option>
                ) : (
                  <>
                    <option value="" className="!text-black">/ (Repository Root)</option>
                    {folders.map((f) => (
                      <option key={f} value={f} className="!text-black">
                        {f}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDownIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Brand Logo Image</label>
          <div className="flex gap-4 mb-3">
            <button
              type="button"
              onClick={() => setUploadMethod("url")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                uploadMethod === "url"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Paste Image URL
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
              Upload Local File
            </button>
          </div>

          {uploadMethod === "url" ? (
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="e.g. https://images.shopmarkline.in/..."
              className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1 bg-white mb-2"
            />
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="h-10 text-sm font-semibold border-slate-200 text-slate-900 focus-visible:ring-1 cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
          )}

          {/* Logo Preview Block */}
          {imageUrl && (
            <div className="relative mt-2 p-3 border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase self-start">Logo Preview</span>
              <div className="relative max-w-[200px] max-h-[150px] border border-slate-200 rounded-md overflow-hidden bg-white shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Brand Logo Preview"
                  className="max-h-[148px] object-contain mx-auto"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "https://placehold.co/200x150?text=Invalid+Logo+URL"
                  }}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-100 transition-opacity shadow"
                onClick={() => {
                  setImageUrl("")
                  setLocalFile(null)
                }}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Short Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter brand short description..."
            rows={5}
            className="w-full p-3 text-sm font-semibold !text-black border border-slate-200 rounded-md bg-white shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Gender Segment</label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-10 pl-3 pr-8 text-sm font-semibold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="men" className="!text-black">Men</option>
                <option value="women" className="!text-black">Women</option>
                <option value="kids" className="!text-black">Kids</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">Discount Promotion</label>
            <div className="relative">
              <select
                value={discountKey}
                onChange={(e) => setDiscountKey(e.target.value)}
                className="w-full h-10 pl-3 pr-8 text-sm font-semibold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="" className="!text-black">No Discount</option>
                {discountsList.map((d) => (
                  <option key={d.id} value={d.id} className="!text-black">
                    {d.name} ({d.percentage})
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Status Card */}
        <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
          <CardContent className="p-5">
            <div className="space-y-4 mb-5 border-b border-slate-100 pb-5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-600">Status</span>
                <span className="font-bold text-blue-700 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div> Draft
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-600">Visibility</span>
                <span className="font-bold text-slate-900">Public Storefront</span>
              </div>
            </div>
            <Button variant="outline" disabled className="w-full font-semibold text-slate-700 border-slate-200 shadow-sm h-9">
              Preview Brand Page
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
