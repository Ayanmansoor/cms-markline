import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { GeneralTab } from "@/components/products/general-tab"
import { SeoTab } from "@/components/products/seo-tab"
import { VariantsTab, Variant, VariantImage, parseVariantImage } from "@/components/products/variants-tab"
import { uploadService } from "@/services/upload.service"
import { toast } from "sonner"

import { formatVariantSizesForDb, formatVariantColorsForDb, formatVariantImagesForDb } from "./product-update-form"

export function ProductCreateForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Target GitHub folder selection
  const [selectedFolder, setSelectedFolder] = useState<string>("")

  // Form State
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [brandKey, setBrandKey] = useState("")
  const [collectionKey, setCollectionKey] = useState("")
  const [gender, setGender] = useState("Men")
  const [materials, setMaterials] = useState("<ul><li><strong>Upper:</strong> Leather</li><li><strong>Sole:</strong> Rubber</li></ul>")
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
      toast.error("Please add at least one variant")
      return
    }

    setIsLoading(true)
    const toastId = toast.loading("Processing variant images & creating product...")

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

        const formattedImageUrls = formatVariantImagesForDb(updatedImages, v.colorName)
        const unit = v.sizeUnit || "EU"
        const formattedSizes = formatVariantSizesForDb(v.sizes, unit)
        const formattedColors = formatVariantColorsForDb(v.colorName, v.colorHex)

        processedVariants.push({
          sku: v.sku,
          mrp: Number(v.mrp) || 0,
          retail_price: Number(v.retail_price) || 0,
          stock: Number(v.stock) || 0,
          sizes: formattedSizes,
          color: v.colorName,
          colorHex: v.colorHex,
          colors: formattedColors,
          images: updatedImages,
          image_url: formattedImageUrls,
          is_active: v.isActive !== false,
          discount_id: v.discountKey ? Number(v.discountKey) : null,
          discount_key: v.discountKey ? Number(v.discountKey) : null,
        })
      }

      const payload = {
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

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Product created successfully", { id: toastId })
        router.push("/products")
      } else {
        toast.error(data.error || "Failed to create product", { id: toastId })
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while creating product", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Create New Product</h2>
          <p className="text-xs text-muted-foreground">Add details, media, variants, and SEO attributes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/products")}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="variants">Variants & Inventory</TabsTrigger>
          <TabsTrigger value="seo">SEO & Links</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border">
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants">
          <Card className="border">
            <CardContent className="pt-6">
              <VariantsTab
                variants={variants}
                setVariants={setVariants}
                productName={name}
                discountsList={discounts}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="border">
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

