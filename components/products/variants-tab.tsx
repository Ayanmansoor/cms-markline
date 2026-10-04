import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, Trash2, ChevronDownIcon, UploadCloud, FolderIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface VariantImage {
  id: string
  url: string
  name: string
  size?: number
  file?: File // raw file object to be uploaded on save
  isNew: boolean
}

export interface Variant {
  id: number
  colorName: string
  colorHex?: string
  sku: string
  mrp: string
  retail_price: string
  stock: string
  sizes: string[]
  sizeUnit?: "UK" | "EU"
  images?: VariantImage[] // Structured image objects instead of serialized string array
  imageUrls: string[] // legacy fallback compat
  isActive?: boolean
  discountKey?: string
}

export interface VariantsTabProps {
  variants: Variant[]
  setVariants: React.Dispatch<React.SetStateAction<Variant[]>>
  productName: string
  discountsList?: { id: string; name: string; percentage: string }[]
  selectedFolder?: string
  setSelectedFolder?: (val: string) => void
}

export const UK_IND_SIZES = ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"]
export const EU_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"]
export const AVAILABLE_SHOE_SIZES = [...UK_IND_SIZES, ...EU_SIZES]

// Safe JSON parser utility for image metadata
export function parseVariantImage(val: string | any): VariantImage {
  if (!val) return { id: String(Math.random()), url: "", name: "", isNew: false }

  if (typeof val === 'object' && (val.url || val.image_url)) {
    return {
      id: val.id || String(Math.random()),
      url: val.url || val.image_url,
      name: val.name || "image.png",
      size: val.size,
      isNew: !!val.isNew,
      file: val.file
    }
  }

  const cleanVal = String(val).trim().replace(/^"|"$/g, '')

  try {
    const parsed = JSON.parse(cleanVal)
    if (parsed && typeof parsed === "object") {
      return {
        id: parsed.id || String(Math.random()),
        url: parsed.image_url || parsed.url || parsed.url_val || parsed.imageUrl || "",
        name: parsed.name || "image.png",
        size: parsed.size,
        isNew: false
      }
    }
  } catch {
    // Fallback if the value is a plain URL string
  }

  return { id: String(Math.random()), url: cleanVal, name: "image.png", isNew: false }
}

export function VariantsTab({
  variants,
  setVariants,
  productName,
  discountsList = [],
  selectedFolder: propSelectedFolder,
  setSelectedFolder: propSetSelectedFolder,
}: VariantsTabProps) {
  const [folders, setFolders] = useState<string[]>([])
  const [localSelectedFolder, setLocalSelectedFolder] = useState<string>("")
  const [isFoldersLoading, setIsFoldersLoading] = useState(false)

  const selectedFolder = propSelectedFolder !== undefined ? propSelectedFolder : localSelectedFolder
  const setSelectedFolder = propSetSelectedFolder || setLocalSelectedFolder

  // Fetch available folders in the GitHub repository
  useEffect(() => {
    async function loadFolders() {
      setIsFoldersLoading(true)
      try {
        const res = await fetch("/api/upload/folders")
        if (res.ok) {
          const data = await res.json()
          if (data.folders) {
            setFolders(data.folders)
            if (data.folders.length > 0 && !selectedFolder) {
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
  }, [selectedFolder, setSelectedFolder])

  const handleAddVariant = () => {
    const newVariant: Variant = {
      id: Date.now(),
      colorName: "Black",
      colorHex: "#000000",
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      mrp: "299.99",
      retail_price: "199.99",
      stock: "50",
      sizes: ["9", "10", "11"],
      imageUrls: [],
      images: [],
      isActive: true,
      discountKey: ""
    }
    setVariants(prev => [...prev, newVariant])
  }

  const handleRemoveVariant = (id: number) => {
    if (variants.length <= 1) {
      alert("A product must have at least one variant!")
      return
    }
    setVariants(prev => prev.filter(v => v.id !== id))
  }

  const handleUpdateVariant = (id: number, updates: Partial<Variant>) => {
    setVariants(prev =>
      prev.map(v => (v.id === id ? { ...v, ...updates } : v))
    )
  }

  const handleUnitChange = (variantId: number, newUnit: "UK" | "EU") => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const oldUnit = v.sizeUnit || "EU"
          if (oldUnit === newUnit) return v

          let updatedSizes = v.sizes
          if (oldUnit === "EU" && newUnit === "UK") {
            // Convert active EU sizes (35-46) to UK sizes (5-16)
            updatedSizes = v.sizes.map((s) => {
              const num = parseInt(s)
              if (!isNaN(num) && num >= 30) return String(num - 30)
              return s
            })
          } else if (oldUnit === "UK" && newUnit === "EU") {
            // Convert active UK sizes (5-16) to EU sizes (35-46)
            updatedSizes = v.sizes.map((s) => {
              const num = parseInt(s)
              if (!isNaN(num) && num <= 20 && num > 0) return String(num + 30)
              return s
            })
          }

          return { ...v, sizeUnit: newUnit, sizes: updatedSizes }
        }
        return v
      })
    )
  }

  const handleToggleSize = (variantId: number, targetSize: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const unit = v.sizeUnit || "EU"
          const num = parseInt(targetSize)

          let norm = targetSize
          let alt = ""
          if (!isNaN(num)) {
            if (unit === "EU" && num <= 20 && num > 0) {
              norm = String(num + 30)
              alt = String(num)
            } else if (unit === "UK" && num >= 30) {
              norm = String(num - 30)
              alt = String(num)
            } else if (num >= 30) {
              alt = String(num - 30)
            } else if (num <= 20 && num > 0) {
              alt = String(num + 30)
            }
          }

          const isCurrentlySelected = v.sizes.includes(norm) || (alt ? v.sizes.includes(alt) : false)

          let updatedSizes: string[] = []
          if (isCurrentlySelected) {
            updatedSizes = v.sizes.filter((s) => s !== norm && s !== alt)
          } else {
            updatedSizes = [...v.sizes.filter((s) => s !== alt), norm]
          }

          return { ...v, sizes: updatedSizes }
        }
        return v
      })
    )
  }

  // Handle local preview selection with deferred uploading
  const handleFileChange = (variantId: number, file: File | null) => {
    if (!file) return

    // 1. Automatic folder selection based on filename matching
    const filenameLower = file.name.toLowerCase()
    if (folders.length > 0) {
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

    const previewUrl = URL.createObjectURL(file)
    const newImage: VariantImage = {
      id: String(Date.now() + Math.random()),
      url: previewUrl,
      name: file.name,
      size: file.size,
      file: file,
      isNew: true
    }

    setVariants(prev =>
      prev.map(v => {
        if (v.id === variantId) {
          const currentImages = v.images || (v.imageUrls || []).map(parseVariantImage)
          const updatedImages = [...currentImages, newImage]
          return {
            ...v,
            images: updatedImages,
            imageUrls: updatedImages.map(img => JSON.stringify(img))
          }
        }
        return v
      })
    )
  }

  const handleRemoveImage = (variantId: number, imgIndex: number) => {
    setVariants(prev =>
      prev.map(v => {
        if (v.id === variantId) {
          const currentImages = v.images || (v.imageUrls || []).map(parseVariantImage)
          const targetImage = currentImages[imgIndex]
          if (targetImage && targetImage.isNew && targetImage.url.startsWith("blob:")) {
            URL.revokeObjectURL(targetImage.url)
          }
          const updatedImages = currentImages.filter((_, i) => i !== imgIndex)
          return {
            ...v,
            images: updatedImages,
            imageUrls: updatedImages.map(img => JSON.stringify(img))
          }
        }
        return v
      })
    )
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, variantId: number) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(file => {
        handleFileChange(variantId, file)
      })
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1">
            <span className="hover:text-slate-900 cursor-pointer">Products</span>
            <span className="mx-1">{'>'}</span>
            <span className="hover:text-slate-900 cursor-pointer">{productName || "New Product"}</span>
            <span className="mx-1">{'>'}</span>
            <span className="font-bold text-slate-900">Variants</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">{productName || "New Product"}</h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] font-bold text-slate-600 bg-slate-100 border-slate-200 rounded-sm px-1.5 py-0 capitalize">
              {variants.length} Variant{variants.length !== 1 ? 's' : ''} Total
            </Badge>
          </div>
        </div>
        <div>
          <Button
            type="button"
            onClick={handleAddVariant}
            className="text-sm font-semibold bg-black text-white hover:bg-black/90 shadow-sm h-9"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add Variant
          </Button>
        </div>
      </div>

      {/* Target Folder Path Selection Card */}
      <Card className="shadow-xs border border-slate-200 rounded-xl bg-white mb-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <FolderIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">GitHub Storage Category</p>
              <p className="text-[10px] text-slate-400 font-semibold">Select the target folder folder in GitHub repository to store variant images.</p>
            </div>
          </div>
          <div className="w-full sm:w-72 relative">
            <select
              value={selectedFolder}
              disabled={isFoldersLoading}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full h-9 pl-3 pr-8 text-xs font-bold !text-black border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {isFoldersLoading ? (
                <option value="">Fetching repository folders...</option>
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
      </Card>

      <div className="space-y-6">
        {variants.map((variant, index) => {
          const inStock = parseInt(variant.stock) > 0
          const variantActive = variant.isActive !== false

          return (
            <Card key={variant.id} className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4 w-full max-w-xl">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="relative w-7 h-7 rounded-full shadow-sm border border-slate-300 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: variant.colorHex || "#334155" }}
                    >
                      <input
                        type="color"
                        value={variant.colorHex || "#334155"}
                        onChange={(e) => handleUpdateVariant(variant.id, { colorHex: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <Input
                      value={variant.colorHex || ""}
                      onChange={(e) => handleUpdateVariant(variant.id, { colorHex: e.target.value })}
                      placeholder="#000000"
                      className="h-8 text-xs font-semibold bg-white border-slate-300 w-20 !text-black uppercase p-1.5 text-center"
                    />
                  </div>
                  <Input
                    value={variant.colorName}
                    onChange={(e) => handleUpdateVariant(variant.id, { colorName: e.target.value })}
                    placeholder="Color Name"
                    className="h-8 text-sm font-bold bg-white border-slate-300 w-36 !text-black"
                  />
                  <Badge variant="outline" className={`text-[10px] font-bold capitalize tracking-wide px-1.5 ${inStock ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
                    }`}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </Badge>

                  {/* Active Toggle Switch */}
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                    <div
                      onClick={() => handleUpdateVariant(variant.id, { isActive: !variantActive })}
                      className={`w-9 h-5 rounded-full flex items-center p-0.5 cursor-pointer border transition-colors ${variantActive ? 'bg-blue-600 border-blue-600 justify-end' : 'bg-slate-200 border-slate-300 justify-start'
                        }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                        {variantActive && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 capitalize tracking-wider select-none">Active</span>
                  </div>
                  {/* Size Unit Selector */}
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                    <span className="text-[11px] font-bold text-slate-500 capitalize tracking-wider select-none">Unit:</span>
                    <div className="relative">
                      <select
                        value={variant.sizeUnit || "EU"}
                        onChange={(e) => handleUnitChange(variant.id, e.target.value as "UK" | "EU")}
                        className="h-8 pl-2 pr-6 text-xs font-bold text-slate-900 border border-slate-300 rounded-md bg-white shadow-xs appearance-none outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="EU">EU (35-46)</option>
                        <option value="UK">UK / IND (5-16)</option>
                      </select>
                      <ChevronDownIcon className="absolute right-1.5 top-2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveVariant(variant.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Images */}
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-2">Variant Images</p>

                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {((variant.images && variant.images.length > 0)
                      ? variant.images
                      : (variant.imageUrls || []).map(parseVariantImage)
                    ).map((img, imgIdx) => {
                      return (
                        <div key={imgIdx} className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group shadow-sm h-28 flex flex-col justify-between">
                          <div
                            className="w-full h-16 bg-contain bg-no-repeat bg-center bg-slate-50 mt-1"
                            style={{ backgroundImage: `url(${img.url})` }}
                          ></div>
                          <div className="p-1.5 border-t border-slate-100 bg-white">
                            <p className="text-[9px] font-bold text-slate-800 truncate leading-none mb-0.5">
                              {img.name || `image-${imgIdx + 1}.png`}
                            </p>
                            {img.size && (
                              <p className="text-[8px] text-slate-400 font-medium">
                                {(img.size / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(variant.id, imgIdx)}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      )
                    })}

                    {/* Upload Card */}
                    <label
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, variant.id)}
                      className={`flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all relative ${
                        ((variant.images && variant.images.length > 0) ? variant.images : (variant.imageUrls || [])).length > 0 ? 'h-28' : 'col-span-2 h-28'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center p-2 text-center">
                        <UploadCloud className="h-5 w-5 text-slate-400 mb-1" />
                        <p className="text-[9px] font-bold text-slate-500 capitalize tracking-wider">Add Image</p>
                        {((variant.images && variant.images.length > 0) ? variant.images : (variant.imageUrls || [])).length === 0 && (
                          <p className="text-[8px] text-slate-400 font-medium mt-0.5">Drag & drop or click</p>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files
                          if (files) {
                            Array.from(files).forEach(file => {
                              handleFileChange(variant.id, file)
                            })
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Pricing & SKU */}
                <div className="md:col-span-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-2">MRP ($)</p>
                    <Input
                      value={variant.mrp}
                      onChange={(e) => handleUpdateVariant(variant.id, { mrp: e.target.value })}
                      type="number"
                      step="0.01"
                      className="h-8 text-xs font-semibold border-slate-300 !text-black"
                      placeholder="MRP"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-2">Retail Price ($)</p>
                    <Input
                      value={variant.retail_price}
                      onChange={(e) => handleUpdateVariant(variant.id, { retail_price: e.target.value })}
                      type="number"
                      step="0.01"
                      className="h-8 text-xs font-semibold border-slate-300 !text-black"
                      placeholder="Retail Price"
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-2">Inventory Stock</p>
                    <Input
                      value={variant.stock}
                      onChange={(e) => handleUpdateVariant(variant.id, { stock: e.target.value })}
                      type="number"
                      className="h-8 text-xs font-semibold border-slate-300 !text-black"
                      placeholder="Stock"
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-2">Discount Promotion</p>
                    <div className="relative">
                      <select
                        value={variant.discountKey || ""}
                        onChange={(e) => handleUpdateVariant(variant.id, { discountKey: e.target.value || "" })}
                        className="w-full h-8 pl-2.5 pr-8 text-xs font-semibold text-slate-900 border border-slate-300 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="" className="!text-black">No Discount</option>
                        {discountsList.map((d) => (
                          <option key={d.id} value={d.id} className="!text-black">
                            {d.name} ({d.percentage})
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-2 top-2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-2">SKU Identification</p>
                    <Input
                      value={variant.sku}
                      onChange={(e) => handleUpdateVariant(variant.id, { sku: e.target.value })}
                      className="h-8 text-xs font-semibold border-slate-300 !text-black"
                      placeholder="SKU"
                    />
                  </div>

                  {/* Live Price Preview Box */}
                  {(() => {
                    const mrpNum = parseFloat(variant.mrp) || 0;
                    const retailNum = parseFloat(variant.retail_price) || 0;
                    const selectedDiscount = discountsList.find(d => d.id === variant.discountKey);

                    const baseDiscount = Math.max(0, mrpNum - retailNum);
                    const baseDiscountPercent = mrpNum > 0 ? (baseDiscount / mrpNum) * 100 : 0;

                    let promoDiscount = 0;
                    if (selectedDiscount) {
                      const pctStr = selectedDiscount.percentage || "0";
                      const discountVal = parseFloat(pctStr) || 0;
                      promoDiscount = retailNum * (discountVal / 100);
                      promoDiscount = Math.min(promoDiscount, retailNum);
                    }

                    const finalPrice = Math.max(0, retailNum - promoDiscount);
                    const totalSavings = Math.max(0, mrpNum - finalPrice);
                    const totalSavingsPercent = mrpNum > 0 ? (totalSavings / mrpNum) * 100 : 0;

                    if (mrpNum > 0 || retailNum > 0) {
                      return (
                        <div className="col-span-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[11px] font-bold text-emerald-800">
                          <p className="capitalize tracking-wider text-[9px] text-emerald-600 mb-1">Pricing Calculations Preview</p>
                          <div className="space-y-0.5">
                            <div className="flex justify-between">
                              <span>Base Markdown (MRP → Retail):</span>
                              <span>₹{baseDiscount.toFixed(2)} ({baseDiscountPercent.toFixed(1)}% off)</span>
                            </div>
                            {promoDiscount > 0 && (
                              <div className="flex justify-between">
                                <span>Promo Discount (Retail → Sale):</span>
                                <span>-₹{promoDiscount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-emerald-100 pt-1 mt-1 text-xs text-emerald-950 font-extrabold">
                              <span>Final Selling Price:</span>
                              <span>₹{finalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-emerald-700">
                              <span>Total Combined Savings:</span>
                              <span>₹{totalSavings.toFixed(2)} ({totalSavingsPercent.toFixed(1)}% saved)</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null;
                  })()}
                </div>

                {/* Sizes Selection */}
                <div className="md:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider">
                      Available Sizes ({(variant.sizeUnit || "EU") === "EU" ? "EU" : "UK/IND"})
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUnitChange(variant.id, "EU")}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          (variant.sizeUnit || "EU") === "EU" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        EU
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnitChange(variant.id, "UK")}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          (variant.sizeUnit || "EU") === "UK" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        UK / IND
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {((variant.sizeUnit || "EU") === "EU" ? EU_SIZES : UK_IND_SIZES).map((size) => {
                      const num = parseInt(size)
                      const euEquivalent = num <= 20 ? String(num + 30) : size
                      const ukEquivalent = num >= 30 ? String(num - 30) : size

                      const isSelected =
                        variant.sizes.includes(size) ||
                        variant.sizes.includes(euEquivalent) ||
                        variant.sizes.includes(ukEquivalent)

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleToggleSize(variant.id, size)}
                          className={`h-8 w-8 p-0 text-xs font-bold rounded border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>

                  {/* Other / Custom Sizes currently active */}
                  {(() => {
                    const presetList = (variant.sizeUnit || "EU") === "EU" ? EU_SIZES : UK_IND_SIZES
                    const extraSizes = variant.sizes.filter((s) => {
                      const num = parseInt(s)
                      const euEq = !isNaN(num) && num <= 20 ? String(num + 30) : s
                      const ukEq = !isNaN(num) && num >= 30 ? String(num - 30) : s
                      return !presetList.includes(s) && !presetList.includes(euEq) && !presetList.includes(ukEq)
                    })
                    if (extraSizes.length > 0) {
                      return (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1">Custom Sizes Active</p>
                          <div className="flex flex-wrap gap-1.5">
                            {extraSizes.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleToggleSize(variant.id, s)}
                                className="h-8 min-w-8 px-2 text-xs font-bold rounded border cursor-pointer bg-blue-600 text-white border-blue-600"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
