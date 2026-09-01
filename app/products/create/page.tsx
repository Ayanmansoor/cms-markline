"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function CreateProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { register, watch, setValue, getValues } = useForm<ProductFormValues>({ defaultValues: defaultFormValues })

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
  const [variants, setVariants] = useState<Variant[]>([

  ])

  // Fetch brand, collection, content group, and discount metadata
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

        const discountsRes = await fetch("/api/discounts?limit=100")
        if (discountsRes.ok) {
          const discountsData = await discountsRes.json()
          setDiscounts(discountsData.discounts || [])
        }
      } catch (err) {
        console.error("Failed to load product form metadata:", err)
      }
    }
    fetchMetadata()
  }, [])

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

    // Match gender with custom Postgres Enum 'genders' (usually lowercase or matching values: men, women, kids)
    let genderEnum = v.gender.toLowerCase()
    if (genderEnum !== "men" && genderEnum !== "women" && genderEnum !== "kids") {
      genderEnum = "men"
    }

    try {
      // Defer-Upload: loop variants and upload any isNew images sequentially to prevent commit collisions
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

            // Revoke object URL to free memory
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
          price: vr.retail_price ? parseFloat(vr.retail_price) : 0,
        })
      }

      toast.loading("Saving product details to database...", { id: toastId })

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

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create product")
      }

      toast.success("Product created successfully! Task is complete", { id: toastId })
      router.push("/products")
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving product")
    } finally {
      setIsLoading(false)
    }
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
                <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Create Product</h1>
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
