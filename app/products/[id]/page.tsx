"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"

import { GeneralTab } from "@/components/products/general-tab"
import { SeoTab } from "@/components/products/seo-tab"
import { VariantsTab, Variant } from "@/components/products/variants-tab"
import { toast } from "sonner"

interface ProductFormValues {
  name: string
  slug: string
  description: string
  brandKey: string
  collectionKey: string
  gender: string
  materials: string
  isLimitedEdition: boolean
  isNewArrival: boolean
  seoTitle: string
  seoDescription: string
  grouptype: string
  isActive: boolean
  keywords: string[]
  amazonUrl: string
  flipkartUrl: string
}

const defaultFormValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  brandKey: "",
  collectionKey: "",
  gender: "Men",
  materials: "<ul><li><strong>Upper:</strong> Leather</li><li><strong>Sole:</strong> Rubber</li></ul>",
  isLimitedEdition: false,
  isNewArrival: false,
  seoTitle: "",
  seoDescription: "",
  grouptype: "",
  isActive: true,
  keywords: [],
  amazonUrl: "",
  flipkartUrl: "",
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingProduct, setIsFetchingProduct] = useState(true)
  const { register, watch, setValue, reset, getValues } = useForm<ProductFormValues>({ defaultValues: defaultFormValues })

  const name = watch("name")
  const slug = watch("slug")
  const description = watch("description")
  const brandKey = watch("brandKey")
  const collectionKey = watch("collectionKey")
  const gender = watch("gender")
  const materials = watch("materials")
  const isLimitedEdition = watch("isLimitedEdition")
  const isNewArrival = watch("isNewArrival")
  const seoTitle = watch("seoTitle")
  const seoDescription = watch("seoDescription")
  const grouptype = watch("grouptype")
  const isActive = watch("isActive")
  const watchedKeywords = watch("keywords") || []
  const amazonUrl = watch("amazonUrl") || ""
  const flipkartUrl = watch("flipkartUrl") || ""

  // Dynamic Metadata Dropdown States
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [collections, setCollections] = useState<{ id: string | number; name: string }[]>([])
  const [contentGroups, setContentGroups] = useState<{ id: string | number; heading: string }[]>([])
  const [discounts, setDiscounts] = useState<{ id: string; name: string; percentage: string }[]>([])

  // Variants State
  const [variants, setVariants] = useState<Variant[]>([])

  // Fetch product data and metadata
  useEffect(() => {
    async function fetchData() {
      try {
        // Load metadata options
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

        const discountsRes = await fetch("/api/discounts?limit=100")
        if (discountsRes.ok) {
          const discountsData = await discountsRes.json()
          setDiscounts(discountsData.discounts || [])
        }

        // Load specific product details
        const productRes = await fetch(`/api/products/${productId}`)
        if (!productRes.ok) {
          throw new Error("Failed to load product details")
        }
        const productData = await productRes.json()
        const p = productData.product

        if (p) {
          let genderStr = "Men"
          if (p.gender) {
            const lower = p.gender.toLowerCase()
            if (lower === "women") genderStr = "Women"
            else if (lower === "kids") genderStr = "Kids"
          }

          let materialsVal = ""
          if (p.materials_used) {
            try {
              const parsed = JSON.parse(p.materials_used)
              if (Array.isArray(parsed)) {
                const listItems = parsed
                  .map((item: any) => {
                    if (item && typeof item === "object") {
                      const key = item.key || ""
                      const val = item.value || ""
                      return `<li><strong>${key}:</strong> ${val}</li>`
                    }
                    return `<li>${item}</li>`
                  })
                  .join("")
                materialsVal = `<ul>${listItems}</ul>`
              } else {
                materialsVal = p.materials_used
              }
            } catch {
              materialsVal = p.materials_used
            }
          }

          reset({
            name: p.name || "",
            slug: p.slug || "",
            description: p.description || "",
            brandKey: p.brand_key || "",
            collectionKey: p.collection_key ? String(p.collection_key) : "",
            gender: genderStr,
            materials: materialsVal,
            isLimitedEdition: !!p.is_limited_edition,
            isNewArrival: !!p.is_new_arrival,
            seoTitle: p.seoTitle || "",
            seoDescription: p.seoDescription || "",
            grouptype: p.grouptype ? String(p.grouptype) : "",
            isActive: p.is_active !== false,
            keywords: p.keywords || [],
            amazonUrl: p.amazon_url || "",
            flipkartUrl: p.flipkart_url || "",
          })

          // Map variants
          if (p.product_variants && Array.isArray(p.product_variants)) {
            const mapped = p.product_variants.map((v: any) => {
              let colorName = "Black"
              let colorHex = "#000000"
              if (v.colors && v.colors.length > 0) {
                const firstCol = v.colors[0]
                try {
                  const parsed = JSON.parse(firstCol)
                  colorName = parsed.name || firstCol
                  colorHex = parsed.hex || "#000000"
                } catch {
                  colorName = firstCol
                }
              }

              const sizes = (v.sizes || []).map((s: string) => {
                try {
                  const parsed = JSON.parse(s)
                  const sizeVal = String(parsed.size || s)
                  const sizeNum = parseInt(sizeVal)
                  if (!isNaN(sizeNum) && sizeNum >= 30) {
                    return String(sizeNum - 30)
                  }
                  return sizeVal
                } catch {
                  const sizeNum = parseInt(s)
                  if (!isNaN(sizeNum) && sizeNum >= 30) {
                    return String(sizeNum - 30)
                  }
                  return String(s)
                }
              })

              const imageUrls = (v.image_url || []).map((img: any) => {
                if (typeof img === 'string') {
                  return img
                }
                return JSON.stringify(img)
              })

              return {
                id: v.id,
                colorName,
                colorHex,
                sku: v.sku || "",
                mrp: v.mrp ? String(v.mrp) : "0",
                retail_price: v.retail_price ? String(v.retail_price) : "0",
                stock: v.stock ? String(v.stock) : "0",
                sizes,
                imageUrls,
                isActive: v.is_active !== false,
                discountKey: v.discount_key || ""
              }
            })
            setVariants(mapped)
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load product details")
        router.push("/products")
      } finally {
        setIsFetchingProduct(false)
      }
    }

    fetchData()
  }, [productId, router, reset])

  // Save Function
  const [selectedFolder, setSelectedFolder] = useState("")

  const handleSave = async () => {
    const v = getValues()
    if (!v.name.trim()) {
      toast.error("Product Name is required!")
      return
    }
    if (!v.slug.trim()) {
      toast.error("URL Slug is required!")
      return
    }

    setIsLoading(true)

    let genderEnum = v.gender.toLowerCase()
    if (genderEnum !== "men" && genderEnum !== "women" && genderEnum !== "kids") {
      genderEnum = "men"
    }

    try {
      // Defer-Upload: upload any newly selected files sequentially to prevent commit collisions
      const toastId = toast.loading("Processing variant images...")
      
      const updatedVariants = []
      for (const vr of variants) {
        const currentImages = vr.images || (vr.imageUrls || []).map(imgStr => {
          try {
            const cleanStr = String(imgStr).trim().replace(/^"|"$/g, '')
            const parsed = JSON.parse(cleanStr)
            return { url: parsed.image_url || parsed.url, name: parsed.name, size: parsed.size, isNew: false }
          } catch {
            return { url: imgStr, name: "image.png", isNew: false }
          }
        })

        const finalUrls = []
        for (const img of currentImages) {
          let resolvedUrl = img.url

          if (img.isNew && img.file) {
            const formData = new FormData()
            formData.append("file", img.file)
            if (selectedFolder) {
              formData.append("folder", selectedFolder)
            }

            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            const data = await res.json()
            if (!res.ok) {
              throw new Error(data.error || `Failed to upload image "${img.name}" to GitHub`)
            }

            if (img.url.startsWith("blob:")) {
              URL.revokeObjectURL(img.url)
            }

            resolvedUrl = data.url
          }

          // Build exact same target format JSON keys
          finalUrls.push(
            JSON.stringify({
              name: img.name ? img.name.replace(/\.[^/.]+$/, "") : "image", // Clean name (strip extension)
              color: vr.colorName.trim(),
              image_url: resolvedUrl
            })
          )
        }

        updatedVariants.push({
          sku: vr.sku.trim(),
          colors: [
            JSON.stringify({
              name: vr.colorName.trim(),
              hex: vr.colorHex || "#000000"
            })
          ],
          sizes: vr.sizes.map(s => JSON.stringify({ size: s, unit: "UK" })),
          stock: vr.stock ? parseInt(vr.stock) : 0,
          image_url: finalUrls,
          is_active: v.isActive ? true : (vr.isActive !== false),
          discount_key: vr.discountKey || null,
          mrp: vr.mrp ? parseFloat(vr.mrp) : 0,
          retail_price: vr.retail_price ? parseFloat(vr.retail_price) : 0,
        })
      }

      toast.loading("Saving updated product details to database...", { id: toastId })

      const payload = {
        name: v.name.trim(),
        description: v.description.trim(),
        gender: genderEnum,
        materials_used: v.materials.trim() || null,
        collection_key: v.collectionKey ? parseInt(v.collectionKey) : null,
        brand_key: v.brandKey || null,
        is_limited_edition: v.isLimitedEdition,
        is_new_arrival: v.isNewArrival,
        is_active: v.isActive,
        seoTitle: v.seoTitle.trim() || null,
        seoDescription: v.seoDescription.trim() || null,
        slug: v.slug.trim(),
        grouptype: v.grouptype ? parseInt(v.grouptype) : null,
        variants: updatedVariants,
        keywords: v.keywords || [],
        amazon_url: v.amazonUrl?.trim() || null,
        flipkart_url: v.flipkartUrl?.trim() || null,
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update product")
      }

      toast.success("Product updated successfully! Task is complete", { id: toastId })
      router.push("/products")
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving product")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetchingProduct) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f7fb]">
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading product details...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f7fb]">
        <SiteHeader />

        <div className="flex flex-1 flex-col p-8 pt-6">
          <Tabs defaultValue="general" className="w-full">
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-6">
                <Button
                  onClick={() => router.push("/products")}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 border border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">{name || "Product Details"}</h1>
                <TabsList className="bg-transparent border-0 h-auto p-0 gap-6">
                  <TabsTrigger value="general" className="!bg-transparent !shadow-none data-[state=active]:!text-slate-900 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">General</TabsTrigger>
                  <TabsTrigger value="variants" className="!bg-transparent !shadow-none data-[state=active]:!text-slate-900 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">Variants</TabsTrigger>
                  <TabsTrigger value="seo" className="!bg-transparent !shadow-none data-[state=active]:!text-slate-900 data-[state=active]:!border-blue-600 border-b-2 border-transparent rounded-none px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-none">SEO</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="general" className="mt-0 outline-none">
              <GeneralTab
                name={name}
                setName={(val) => setValue("name", val)}
                slug={slug}
                setSlug={(val) => setValue("slug", val)}
                description={description}
                setDescription={(val) => setValue("description", val)}
                brandKey={brandKey}
                setBrandKey={(val) => setValue("brandKey", val)}
                collectionKey={collectionKey}
                setCollectionKey={(val) => setValue("collectionKey", val)}
                gender={gender}
                setGender={(val) => setValue("gender", val)}
                materials={materials}
                setMaterials={(val) => setValue("materials", val)}
                isLimitedEdition={isLimitedEdition}
                setIsLimitedEdition={(val) => setValue("isLimitedEdition", val)}
                isNewArrival={isNewArrival}
                setIsNewArrival={(val) => setValue("isNewArrival", val)}
                grouptype={grouptype}
                setGrouptype={(val) => setValue("grouptype", val)}
                brandsList={brands}
                collectionsList={collections}
                groupsList={contentGroups}
                isActive={isActive}
                setIsActive={(val) => setValue("isActive", val)}
                amazonUrl={amazonUrl}
                setAmazonUrl={(val) => setValue("amazonUrl", val)}
                flipkartUrl={flipkartUrl}
                setFlipkartUrl={(val) => setValue("flipkartUrl", val)}
              />
            </TabsContent>

            <TabsContent value="seo" className="mt-0 outline-none">
              <SeoTab
                seoTitle={seoTitle}
                setSeoTitle={(val) => setValue("seoTitle", val)}
                seoDescription={seoDescription}
                setSeoDescription={(val) => setValue("seoDescription", val)}
                slug={slug}
                setSlug={(val) => setValue("slug", val)}
                keywords={watchedKeywords}
                setKeywords={(val) => setValue("keywords", val)}
              />
            </TabsContent>

            <TabsContent value="variants" className="mt-0 outline-none">
              <VariantsTab
                variants={variants}
                setVariants={setVariants}
                productName={name}
                discountsList={discounts}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
              />
            </TabsContent>

          </Tabs>

          <div className="mt-8 pt-4 flex items-center justify-end gap-3 border-t border-slate-200 bg-[#f4f7fb] sticky bottom-0 pb-4">
            <span className="text-xs font-semibold text-slate-500 mr-2">
              {variants.length} variant(s) being configured.
            </span>
            <Button
              variant="outline"
              onClick={() => router.push("/products")}
              disabled={isLoading}
              className="font-bold text-slate-700 border-slate-300 bg-white hover:bg-slate-50 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="font-bold bg-blue-600 text-white hover:bg-blue-700 px-6 shadow-sm"
            >
              {isLoading ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
