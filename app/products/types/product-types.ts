export interface ProductVariant {
  id?: number | string
  sku?: string
  mrp?: number | string
  retail_price?: number | string
  stock?: number | string
  size?: string
  color?: string
  image_url?: any
  is_active?: boolean
}

export interface Product {
  id: number | string
  name: string
  description?: string
  brand_id?: number | string
  brand_key?: string
  brands?: { id: number; name: string }
  brand?: { id: number; name: string }
  collection_id?: number | string
  category_id?: number | string
  gender?: string
  grouptype?: number | string
  group?: { id: number; heading: string }
  grouptype_name?: string
  is_active?: boolean
  product_variants?: ProductVariant[]
  created_at?: string
  updated_at?: string
}

export interface ProductFilterOptions {
  brands: { id: number; name: string }[]
  collections: { id: number; name: string }[]
  groups: { id: number; heading: string }[]
}

export interface ProductAnalytics {
  trendData: { name: string; count: number }[]
  stockAvailability: number
}
