"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2 } from "lucide-react"
import { GeneralTab } from "@/components/products/general-tab"
import { SeoTab } from "@/components/products/seo-tab"
import { VariantsTab, Variant, VariantImage, parseVariantImage } from "@/components/products/variants-tab"
import { uploadService } from "@/services/upload.service"
import { toast } from "sonner"

interface ProductUpdateFormProps {
  productId: string | number
  initialData: any
}

// Utility to parse variant color object/JSON string/plain string
export function parseVariantColorFromData(v: any): { colorName: string; colorHex: string } {
  let raw: any = ""
  if (Array.isArray(v.colors) && v.colors.length > 0) {
    raw = v.colors[0]
  } else if (v.color) {
    raw = v.color
  }

  if (typeof raw === "object" && raw !== null) {
    return {
      colorName: raw.name || raw.colorName || raw.color || "",
      colorHex: raw.hex || raw.colorHex || "#334155",
    }
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim()
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === "object") {
        return {
          colorName: parsed.name || parsed.colorName || parsed.color || "",
          colorHex: parsed.hex || parsed.colorHex || "#334155",
        }
      }
    } catch { }
    return {
      colorName: trimmed,
      colorHex: "#334155",
    }
  }

  return { colorName: "", colorHex: "#334155" }
}

// Utility to parse sizes from text array of JSON strings or plain strings
export function parseVariantSizesFromData(v: any): { sizes: string[]; unit: "UK" | "EU" } {
  let rawSizes = v.sizes || v.size
  if (!rawSizes) return { sizes: [], unit: "EU" }

  let arrayToProcess: any[] = []

  if (Array.isArray(rawSizes)) {
    arrayToProcess = rawSizes
  } else if (typeof rawSizes === "string") {
    const trimmed = rawSizes.trim()
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) arrayToProcess = parsed
      else arrayToProcess = [trimmed]
    } catch {
      arrayToProcess = [trimmed]
    }
  }

  let detectedUnit: "UK" | "EU" = "EU"
  const parsedSizes: string[] = []

  arrayToProcess.forEach((item) => {
    let sizeVal = ""
    let unitVal = ""

    if (typeof item === "string") {
      const trimmed = item.trim()
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === "object") {
          sizeVal = String(parsed.size || parsed.name || parsed.val || "")
          unitVal = String(parsed.unit || "").toUpperCase()
        }
      } catch { }
      if (!sizeVal) sizeVal = trimmed
    } else if (typeof item === "object" && item !== null) {
      sizeVal = String(item.size || item.name || item.val || "")
      unitVal = String(item.unit || "").toUpperCase()
    }

    if (unitVal === "EU" || unitVal === "UK") {
      detectedUnit = unitVal as "UK" | "EU"
    } else if (!unitVal && !isNaN(parseInt(sizeVal)) && parseInt(sizeVal) >= 30) {
      detectedUnit = "EU"
    } else if (!unitVal && !isNaN(parseInt(sizeVal)) && parseInt(sizeVal) <= 20 && parseInt(sizeVal) > 0) {
      detectedUnit = "UK"
    }

    if (sizeVal) {
      parsedSizes.push(sizeVal)
    }
  })

  return { sizes: parsedSizes, unit: detectedUnit }
}

// Utility to format sizes back into JSON string array for DB saving
export function formatVariantSizesForDb(sizes: string[], unit: "UK" | "EU"): string[] {
  return sizes.map((s) => {
    const trimmed = String(s).trim()
    const num = parseInt(trimmed)

    let saveSize = trimmed
    let saveUnit = unit || "EU"

    if (unit === "EU" && !isNaN(num) && num <= 20 && num > 0) {
      saveSize = String(num + 30)
    } else if (unit === "UK" && !isNaN(num) && num >= 30) {
      saveSize = String(num - 30)
    }

    return JSON.stringify({ size: saveSize, unit: saveUnit })
  })
}

// Utility to format colors back into JSON string array for DB saving
export function formatVariantColorsForDb(colorName: string, colorHex?: string): string[] {
  return [
    JSON.stringify({
      name: colorName.trim() || "Default",
      hex: (colorHex && colorHex.trim()) || "#000000",
    }),
  ]
}

// Utility to format variant images back into JSON string array for DB saving
export function formatVariantImagesForDb(images: VariantImage[], colorName: string): string[] {
  return (images || []).map((img) => {
    const imgName = img.name || "image.png"
    const color = colorName || "Default"
    const url = img.url || ""
    return JSON.stringify({
      name: imgName,
      color: color,
      image_url: url,
    })
  })
}


// Utility to robustly parse variant images from string, array, or JSON objects
export function parseVariantImagesFromData(raw: any): VariantImage[] {
  if (!raw) return []

  let arrayToProcess: any[] = []

  if (Array.isArray(raw)) {
    arrayToProcess = raw
  } else if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        arrayToProcess = parsed
      } else if (parsed && typeof parsed === "object") {
        arrayToProcess = [parsed]
      } else if (typeof parsed === "string") {
        arrayToProcess = [parsed]
      }
    } catch {
      arrayToProcess = [trimmed]
    }
  } else if (typeof raw === "object") {
    arrayToProcess = [raw]
  }

  return arrayToProcess
    .map((item, idx) => {
      if (!item) return null
      if (typeof item === "string") {
        const trimmed = item.trim().replace(/^"|"$/g, "")
        try {
          const parsed = JSON.parse(trimmed)
          if (parsed && typeof parsed === "object") {
            return {
              id: parsed.id || String(idx),
              url: parsed.image_url || parsed.url || parsed.imageUrl || "",
              name: parsed.name || `image_${idx + 1}.png`,
              isNew: false,
            }
          }
        } catch { }
        return {
          id: String(idx),
          url: trimmed,
          name: `image_${idx + 1}.png`,
          isNew: false,
        }
      } else if (typeof item === "object") {
        return {
          id: item.id || String(idx),
          url: item.url || item.image_url || item.imageUrl || "",
          name: item.name || `image_${idx + 1}.png`,
          isNew: false,
          size: item.size,
        }
      }
      return null
    })
    .filter((img): img is VariantImage => Boolean(img && img.url))
}

export function ProductUpdateForm({ productId, initialData }: ProductUpdateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Target GitHub folder selection
  const [selectedFolder, setSelectedFolder] = useState<string>("")

  // Form State
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [brandKey, setBrandKey] = useState("")
  const [collectionKey, setCollectionKey] = useState("")
  const [gender, setGender] = useState("Men")
  const [materials, setMaterials] = useState("")
  const [isLimitedEdition, setIsLimitedEdition] = useState(false)
  const [isNewArrival, setIsNewArrival] = useState(false)
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [grouptype, setGrouptype] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [keywords, setKeywords] = useState<string[]>([])
  const [amazonUrl, setAmazonUrl] = useState("")
  const [flipkartUrl, setFlipkartUrl] = useState("")

  // Metadata Lists
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [collections, setCollections] = useState<{ id: string | number; name: string }[]>([])
  const [contentGroups, setContentGroups] = useState<{ id: string | number; heading: string }[]>([])
  const [discounts, setDiscounts] = useState<{ id: string; name: string; percentage: string }[]>([])

  // Variants State
  const [variants, setVariants] = useState<Variant[]>([])

  // Populate & Sync state whenever initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "")
      setSlug(initialData.slug || "")
      setDescription(initialData.description || "")
      setBrandKey(String(initialData.brand_key || initialData.brand_id || ""))
      setCollectionKey(String(initialData.collection_key || initialData.collection_id || ""))

      let gVal = "Men"
      if (initialData.gender) {
        const uppercaseG = String(initialData.gender).toUpperCase()
        if (uppercaseG === "WOMEN") gVal = "Women"
        else if (uppercaseG === "KIDS") gVal = "Kids"
        else gVal = "Men"
      }
      setGender(gVal)

      setMaterials(initialData.materials_used || initialData.materials || "")
      setIsLimitedEdition(!!initialData.is_limited_edition)
      setIsNewArrival(!!initialData.is_new_arrival)

      setSeoTitle(initialData.seoTitle || initialData.seo_title || "")
      setSeoDescription(initialData.seoDescription || initialData.seo_description || "")
      setGrouptype(String(initialData.grouptype || ""))
      setIsActive(initialData.isActive !== undefined ? !!initialData.isActive : initialData.is_active !== false)
      setAmazonUrl(initialData.amazon_url || "")
      setFlipkartUrl(initialData.flipkart_url || "")

      // Parse keywords cleanly
      if (Array.isArray(initialData.keywords)) {
        setKeywords(initialData.keywords)
      } else if (typeof initialData.keywords === "string") {
        try {
          const parsed = JSON.parse(initialData.keywords)
          if (Array.isArray(parsed)) setKeywords(parsed)
          else setKeywords(initialData.keywords.split(",").map((k: string) => k.trim()).filter(Boolean))
        } catch {
          setKeywords(initialData.keywords.split(",").map((k: string) => k.trim()).filter(Boolean))
        }
      } else {
        setKeywords([])
      }

      // Parse variants cleanly
      if (initialData.product_variants && Array.isArray(initialData.product_variants)) {
        const mappedVariants: Variant[] = initialData.product_variants.map((v: any, index: number) => {
          const parsedColor = parseVariantColorFromData(v)
          const parsedSizesObj = parseVariantSizesFromData(v)
          const parsedImages = parseVariantImagesFromData(v.image_url || v.image_urls || v.images)

          return {
            id: v.id || index + 1,
            colorName: parsedColor.colorName,
            colorHex: parsedColor.colorHex,
            sku: v.sku || "",
            mrp: String(v.mrp || "0"),
            retail_price: String(v.retail_price || v.price || "0"),
            stock: String(v.stock || "0"),
            sizes: parsedSizesObj.sizes,
            sizeUnit: parsedSizesObj.unit,
            images: parsedImages,
            imageUrls: parsedImages.map((img) => img.url),
            isActive: v.is_active !== false,
            discountKey: String(v.discount_key || v.discount_id || ""),
          }
        })
        setVariants(mappedVariants)
      }
    }
  }, [initialData])

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const filtersRes = await fetch("/api/filters")
        if (filtersRes.ok) {
          const filtersData = await filtersRes.json()
          setBrands(filtersData.brands || [])
          setCollections(filtersData.collections || [])
        }
        const groupsRes = await fetch("/api/groups")
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json()
          setContentGroups(groupsData.groups || [])
        }
        const discountsRes = await fetch("/api/discounts")
        if (discountsRes.ok) {
          const discountsData = await discountsRes.json()
          setDiscounts(discountsData.discounts || [])
        }
      } catch (err) {
        console.error("Error fetching metadata:", err)
      }
    }
    fetchMetadata()
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Product name is required")
      return
    }

    if (variants.length === 0) {
      toast.error("Product must have at least one variant")
      return
    }

    setIsLoading(true)
    const toastId = toast.loading("Processing variant images & updating product...")

    try {
      // 1. Process deferred file uploads sequentially for variant images to prevent GitHub concurrency conflicts
      const processedVariants = []
      for (const v of variants) {
        const currentImages: VariantImage[] = (v.images && v.images.length > 0)
          ? v.images
          : (v.imageUrls || []).map((url) => parseVariantImage(url))

        const updatedImages: VariantImage[] = []
        for (const img of currentImages) {
          if (img.file && (img.isNew || img.url.startsWith("blob:"))) {
            try {
              const uploadRes = await uploadService.uploadFile(img.file, selectedFolder)
              if (img.url.startsWith("blob:")) {
                URL.revokeObjectURL(img.url)
              }
              updatedImages.push({
                id: img.id,
                url: uploadRes.url,
                name: img.name,
                isNew: false,
              })
            } catch (err: any) {
              toast.error(`Failed to upload ${img.name}: ${err.message}`)
              updatedImages.push(img)
            }
          } else {
            updatedImages.push(img)
          }
        }

        const finalImageUrls = formatVariantImagesForDb(updatedImages, v.colorName)
        const unit = v.sizeUnit || "EU"
        const formattedSizes = formatVariantSizesForDb(v.sizes, unit)
        const formattedColors = formatVariantColorsForDb(v.colorName, v.colorHex)

        processedVariants.push({
          id: v.id,
          sku: v.sku,
          mrp: Number(v.mrp) || 0,
          retail_price: Number(v.retail_price) || 0,
          stock: Number(v.stock) || 0,
          sizes: formattedSizes,
          color: v.colorName,
          colorHex: v.colorHex,
          colors: formattedColors,
          images: updatedImages,
          image_url: finalImageUrls,
          is_active: v.isActive !== false,
          discount_id: v.discountKey ? Number(v.discountKey) : null,
          discount_key: v.discountKey ? Number(v.discountKey) : null,
        })
      }

      const payload = {
        productId,
        product: {
          name: name.trim(),
          slug: slug.trim(),
          description,
          brand_id: brandKey ? Number(brandKey) : null,
          brand_key: brandKey ? String(brandKey) : null,
          collection_id: collectionKey ? Number(collectionKey) : null,
          collection_key: collectionKey ? Number(collectionKey) : null,
          gender: gender.toUpperCase(),
          materials_used: materials,
          materials,
          is_limited_edition: isLimitedEdition,
          is_new_arrival: isNewArrival,
          seoTitle,
          seo_title: seoTitle,
          seoDescription,
          seo_description: seoDescription,
          grouptype: grouptype ? Number(grouptype) : null,
          is_active: isActive,
          isActive,
          keywords,
          amazon_url: amazonUrl ? amazonUrl.trim() : null,
          flipkart_url: flipkartUrl ? flipkartUrl.trim() : null,
        },
        variants: processedVariants,
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Product updated successfully!", { id: toastId })
        router.push("/products")
      } else {
        toast.error(data.error || "Failed to update product", { id: toastId })
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while updating product", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!confirm(`Are you sure you want to delete product "${name || productId}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    const toastId = toast.loading("Deleting product...")

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Product deleted successfully!", { id: toastId })
        router.push("/products")
      } else {
        toast.error(data.error || "Failed to delete product", { id: toastId })
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting product", { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  const isPending = isLoading || isDeleting

  return (
    <>
      <Tabs defaultValue="general" className="w-full">
        {/* Header with Navigation Tabs */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-6">
            <Button
              type="button"
              onClick={() => router.push("/products")}
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">{name || `Edit Product #${productId}`}</h1>
            </div>
            <TabsList className="bg-transparent border-0 h-auto p-0 gap-6 ml-4">
              <TabsTrigger
                value="general"
                className="!bg-transparent !shadow-none data-[state=active]:!text-slate-900 data-[state=active]:!border-slate-900 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none"
              >
                General Information
              </TabsTrigger>
              <TabsTrigger
                value="variants"
                className="!bg-transparent !shadow-none data-[state=active]:!text-slate-900 data-[state=active]:!border-slate-900 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none"
              >
                Variants & Inventory
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="!bg-transparent !shadow-none data-[state=active]:!text-slate-900 data-[state=active]:!border-slate-900 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none"
              >
                SEO & Links
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* TAB 1: General Details */}
        <TabsContent value="general" className="mt-0 outline-none w-full">
          <GeneralTab
            name={name}
            setName={setName}
            slug={slug}
            setSlug={setSlug}
            description={description}
            setDescription={setDescription}
            brandKey={brandKey}
            setBrandKey={setBrandKey}
            collectionKey={collectionKey}
            setCollectionKey={setCollectionKey}
            gender={gender}
            setGender={setGender}
            materials={materials}
            setMaterials={setMaterials}
            isLimitedEdition={isLimitedEdition}
            setIsLimitedEdition={setIsLimitedEdition}
            isNewArrival={isNewArrival}
            setIsNewArrival={setIsNewArrival}
            grouptype={grouptype}
            setGrouptype={setGrouptype}
            brandsList={brands}
            collectionsList={collections}
            groupsList={contentGroups}
            isActive={isActive}
            setIsActive={setIsActive}
            amazonUrl={amazonUrl}
            setAmazonUrl={setAmazonUrl}
            flipkartUrl={flipkartUrl}
            setFlipkartUrl={setFlipkartUrl}
          />
        </TabsContent>

        {/* TAB 2: Variants & Inventory */}
        <TabsContent value="variants" className="mt-0 outline-none w-full">
          <VariantsTab
            variants={variants}
            setVariants={setVariants}
            productName={name}
            discountsList={discounts}
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
          />
        </TabsContent>

        {/* TAB 3: SEO & Links */}
        <TabsContent value="seo" className="mt-0 outline-none w-full">
          <SeoTab
            seoTitle={seoTitle}
            setSeoTitle={setSeoTitle}
            seoDescription={seoDescription}
            setSeoDescription={setSeoDescription}
            slug={slug}
            setSlug={setSlug}
            keywords={keywords}
            setKeywords={setKeywords}
          />
        </TabsContent>

        {/* Sticky Bottom Action Toolbar */}


      </Tabs>
      <div className="mt-8  px-10 py-4 flex items-center justify-between border-t border-slate-200 bg-white sticky -bottom-10 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 text-[11px] font-semibold px-2.5 py-1">
            Gender: {gender || "MEN"}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold px-2.5 py-1 ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
          >
            {isActive ? "Storefront Active" : "Draft / Inactive"}
          </Badge>
          {isLimitedEdition && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold px-2.5 py-1">
              Limited Edition
            </Badge>
          )}
          {isNewArrival && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold px-2.5 py-1">
              New Arrival
            </Badge>
          )}
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-semibold px-2.5 py-1">
            {variants.length} Variant{variants.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDeleteProduct}
            disabled={isPending}
            className="font-bold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 px-3 cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete Product
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/products")}
            disabled={isPending}
            className="font-bold text-slate-700 border-slate-300 bg-white hover:bg-slate-50 px-6 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="font-bold bg-slate-900 text-white hover:bg-black px-6 shadow-xs cursor-pointer"
          >
            {isLoading ? "Saving..." : "Update Product"}
          </Button>
        </div>

      </div>
    </>
  )
}
