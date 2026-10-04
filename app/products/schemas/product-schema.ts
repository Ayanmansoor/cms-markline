import { z } from "zod"

export const productVariantSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  sku: z.string().min(1, "SKU is required"),
  mrp: z.coerce.number().min(0, "MRP must be >= 0"),
  retail_price: z.coerce.number().min(0, "Retail price must be >= 0"),
  stock: z.coerce.number().int().min(0, "Stock must be >= 0"),
  size: z.string().optional(),
  color: z.string().optional(),
  image_url: z.any().optional(),
  is_active: z.boolean().default(true),
})

export const productCreateSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  brand_id: z.union([z.string(), z.number()]).optional(),
  collection_id: z.union([z.string(), z.number()]).optional(),
  category_id: z.union([z.string(), z.number()]).optional(),
  gender: z.string().default("UNISEX"),
  grouptype: z.union([z.string(), z.number()]).optional(),
  is_active: z.boolean().default(true),
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
})

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.union([z.string(), z.number()]),
})

export type ProductCreateFormValues = z.infer<typeof productCreateSchema>
export type ProductUpdateFormValues = z.infer<typeof productUpdateSchema>
