import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Eye, Upload, Link2, Sparkles } from "lucide-react"

interface BannerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  register: any
  watch: any
  setValue: any
  editBanner: any
  collectionOptions: any[]
  bannerImageUploadMethod: "url" | "file"
  setBannerImageUploadMethod: (method: "url" | "file") => void
  bannerIsUploading: boolean
  handleBannerImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function BannerFormModal({
  isOpen,
  onClose,
  onSave,
  register,
  watch,
  setValue,
  editBanner,
  collectionOptions,
  bannerImageUploadMethod,
  setBannerImageUploadMethod,
  bannerIsUploading,
  handleBannerImageFileChange
}: BannerFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl w-full max-h-[85vh] flex flex-col p-6 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {editBanner ? "Edit Collection Banner" : "Create Collection Banner"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Set banner promotion details, target URLs, image assets, and storefront display rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4 overflow-y-auto pr-1">
          {/* Banner Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-900 block">Banner Name</Label>
            <Input
              placeholder="e.g. Wedding Season Slider"
              {...register("bannerName")}
              className="h-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 rounded-lg transition-all"
            />
          </div>

          {/* Target URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-900 block">Redirect Route URL</Label>
            <Input
              placeholder="e.g. /category/weddings"
              {...register("bannerUrl")}
              className="h-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 rounded-lg transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gender configuration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-900 block">Target Gender</Label>
              <select
                {...register("bannerGender")}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
              >
                <option value="WOMEN">Women</option>
                <option value="MEN">Men</option>
                <option value="KIDS">Kids</option>
                <option value="UNISEX">Unisex</option>
              </select>
            </div>

            {/* Select Collection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-900 block">Link to Collection</Label>
              <select
                {...register("bannerCollectionId")}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
              >
                <option value="">-- None (Do not link to any collection) --</option>
                {collectionOptions.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Selection Block */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-slate-900">Banner Image</Label>
              <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setBannerImageUploadMethod("url")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    bannerImageUploadMethod === "url"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" /> Paste URL
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBannerImageUploadMethod("file")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    bannerImageUploadMethod === "file"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Upload className="h-3 w-3" /> Upload File
                  </span>
                </button>
              </div>
            </div>

            {bannerImageUploadMethod === "url" ? (
              <Input
                placeholder="https://example.com/banner-image.jpg"
                {...register("bannerImageUrl")}
                className="h-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 rounded-lg transition-all"
              />
            ) : (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerImageFileChange}
                  className="h-10 text-xs font-medium text-slate-900 bg-slate-50 border-slate-200 rounded-lg file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition-all cursor-pointer"
                />
                {bannerIsUploading && (
                  <div className="text-xs font-medium text-blue-600 animate-pulse flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Uploading image file to server...
                  </div>
                )}
              </div>
            )}

            {watch("bannerImageUrl") && (
              <div className="relative mt-3 h-36 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={watch("bannerImageUrl")} alt="Banner Preview" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-[10px] font-semibold text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                  <Eye className="h-3 w-3" /> Image Preview
                </div>
              </div>
            )}
          </div>

          {/* Display configuration switches as clean cards */}
          <div className="border-t border-slate-100 pt-4 space-y-2.5">
            <Label className="text-xs font-semibold text-slate-900 block mb-2">Display Rules & Status</Label>
            
            <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors">
              <div>
                <Label className="text-xs font-bold text-slate-900 cursor-pointer">Enable Banner</Label>
                <p className="text-[11px] text-slate-500">Toggle visibility on the storefront.</p>
              </div>
              <Switch
                checked={watch("bannerIsEnable")}
                onCheckedChange={(checked) => setValue("bannerIsEnable", checked)}
                className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors">
              <div>
                <Label className="text-xs font-bold text-slate-900 cursor-pointer">Mobile Target</Label>
                <p className="text-[11px] text-slate-500">Optimized layout for mobile viewports.</p>
              </div>
              <Switch
                checked={watch("bannerIsMobile")}
                onCheckedChange={(checked) => setValue("bannerIsMobile", checked)}
                className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors">
              <div>
                <Label className="text-xs font-bold text-slate-900 cursor-pointer">Home Promotional Banner</Label>
                <p className="text-[11px] text-slate-500">Feature this banner inside the Home Promo grid.</p>
              </div>
              <Switch
                checked={watch("bannerHomePromotional")}
                onCheckedChange={(checked) => setValue("bannerHomePromotional", checked)}
                className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-4">
            Cancel
          </Button>
          <Button onClick={onSave} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-5 rounded-lg shadow-sm">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
