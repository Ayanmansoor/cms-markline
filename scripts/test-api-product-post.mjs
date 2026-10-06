import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Key in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testApiPost() {
  console.log('🧪 Testing API POST Endpoint /api/products...\n')

  const { data: brandData } = await supabase.from('brands').select('id, name').limit(1).single()
  const { data: collectionData } = await supabase.from('collection').select('id, name').limit(1).single()

  const testSlug = `api-test-product-${Date.now()}`
  const payload = {
    product: {
      name: 'API Test Premium Derby Shoe',
      slug: testSlug,
      description: 'Handmade Italian leather derby shoes for formal occasions.',
      gender: 'MEN',
      materials: '<ul><li>Upper: Full Grain Calfskin</li><li>Sole: Goodyear Welted Leather</li></ul>',
      materials_used: '<ul><li>Upper: Full Grain Calfskin</li><li>Sole: Goodyear Welted Leather</li></ul>',
      brand_id: brandData?.id,
      brand_key: brandData?.id,
      collection_id: collectionData?.id,
      collection_key: collectionData?.id,
      is_limited_edition: true,
      is_new_arrival: true,
      seo_title: 'API Test Premium Derby Shoe',
      seo_description: 'Discover handcrafted Italian leather derby shoes.',
      is_active: true,
      isActive: true,
      keywords: ['derby', 'italian', 'leather'],
      amazon_url: 'https://amazon.in/dp/derby123',
      flipkart_url: 'https://flipkart.com/p/derby123'
    },
    variants: [
      {
        sku: `DERBY-BLK-${Date.now().toString().slice(-4)}`,
        colorName: 'Midnight Black',
        colorHex: '#000000',
        sizeUnit: 'EU',
        sizes: ['41', '42', '43'],
        mrp: '6999',
        retail_price: '4999',
        stock: '25',
        isActive: true,
        images: [{ url: 'https://example.com/derby-black.jpg' }]
      }
    ]
  }

  const response = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const resJson = await response.json()

  if (!response.ok || !resJson.success) {
    console.error('❌ API Error Response:', resJson)
    process.exit(1)
  }

  const createdProd = resJson.product
  console.log(`✅ API Created Product ID: ${createdProd.id}`)

  // Fetch created product from DB directly to verify all columns
  const { data: dbProduct, error: fetchErr } = await supabase
    .from('product')
    .select('*, product_variants(*)')
    .eq('id', createdProd.id)
    .single()

  if (fetchErr) {
    console.error('❌ Error fetching created product from DB:', fetchErr.message)
    process.exit(1)
  }

  console.log('\n---------------- Verified DB Entry ----------------')
  console.log('ID:', dbProduct.id)
  console.log('Name:', dbProduct.name)
  console.log('Description:', dbProduct.description)
  console.log('Gender:', dbProduct.gender)
  console.log('Materials Used:', dbProduct.materials_used)
  console.log('Brand Key:', dbProduct.brand_key)
  console.log('Collection Key:', dbProduct.collection_key)
  console.log('SEO Title:', dbProduct.seoTitle)
  console.log('SEO Description:', dbProduct.seoDescription)
  console.log('Slug:', dbProduct.slug)
  console.log('Variants Count:', dbProduct.product_variants?.length)
  console.log('---------------------------------------------------\n')

  if (!dbProduct.name || !dbProduct.description || !dbProduct.gender || !dbProduct.materials_used) {
    console.error('❌ FAIL: Product details are NULL in database!')
  } else {
    console.log('🎉 SUCCESS: All product details successfully stored in DB via API!')
  }

  // Cleanup
  await supabase.from('product_variants').delete().eq('products_id', dbProduct.id)
  await supabase.from('product').delete().eq('id', dbProduct.id)
  console.log('🧹 Cleaned up test records.')
}

testApiPost()
