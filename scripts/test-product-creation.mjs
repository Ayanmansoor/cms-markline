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

async function runTest() {
  console.log('🧪 Starting Product Creation Test...\n')

  // Fetch valid brand if available
  const { data: brandData } = await supabase.from('brands').select('id, name').limit(1).single()
  const validBrandKey = brandData ? brandData.id : null

  // Fetch valid collection if available
  const { data: collectionData } = await supabase.from('collection').select('id, name').limit(1).single()
  const validCollectionKey = collectionData ? collectionData.id : null

  console.log(`Using Brand Key: ${validBrandKey} (${brandData?.name || 'None'})`)
  console.log(`Using Collection Key: ${validCollectionKey} (${collectionData?.name || 'None'})\n`)

  const testSlug = `test-product-${Date.now()}`
  const testPayload = {
    product: {
      name: 'Test Oxford Leather Shoe',
      slug: testSlug,
      description: 'A premium handcrafted leather shoe for testing product creation.',
      gender: 'MEN',
      materials_used: '<ul><li>Upper: Premium Calfskin Leather</li><li>Sole: Handcrafted Rubber</li></ul>',
      materials: '<ul><li>Upper: Premium Calfskin Leather</li><li>Sole: Handcrafted Rubber</li></ul>',
      brand_key: validBrandKey,
      brand_id: validBrandKey,
      collection_key: validCollectionKey,
      collection_id: validCollectionKey,
      is_limited_edition: true,
      is_new_arrival: true,
      isActive: true,
      is_active: true,
      seoTitle: 'Test Oxford Leather Shoe - Markline',
      seoDescription: 'Buy premium handcrafted test oxford leather shoes online at Markline.',
      keywords: ['test', 'oxford', 'leather', 'shoe'],
      amazon_url: 'https://amazon.in/dp/test12345',
      flipkart_url: 'https://flipkart.com/p/test12345'
    },
    variants: [
      {
        sku: `TEST-OXFORD-BLK-42-${Date.now().toString().slice(-4)}`,
        colorName: 'Black',
        colorHex: '#000000',
        colors: [JSON.stringify({ name: 'Black', hex: '#000000' })],
        sizes: [JSON.stringify({ size: '42', unit: 'EU' })],
        mrp: 4999,
        retail_price: 2999,
        stock: 50,
        is_active: true,
        image_url: ['https://example.com/test-shoe-black.jpg']
      }
    ]
  }

  console.log('1. Inserting Product into Supabase...')
  
  // Extract product & variants
  const p = testPayload.product

  const { data: insertedProduct, error: prodErr } = await supabase
    .from('product')
    .insert({
      name: p.name,
      description: p.description,
      gender: p.gender,
      materials_used: p.materials_used,
      collection_key: p.collection_key ? parseInt(String(p.collection_key)) : null,
      brand_key: p.brand_key ? String(p.brand_key) : null,
      is_limited_edition: p.is_limited_edition,
      is_new_arrival: p.is_new_arrival,
      isActive: p.isActive,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      slug: p.slug,
      keywords: p.keywords,
      amazon_url: p.amazon_url,
      flipkart_url: p.flipkart_url
    })
    .select()
    .single()

  if (prodErr) {
    console.error('❌ Failed to insert product:', prodErr.message)
    process.exit(1)
  }

  console.log(`✅ Product inserted successfully with ID: ${insertedProduct.id}\n`)

  // Verify fields in inserted product
  console.log('2. Verifying database entry details...')
  console.log('----------------------------------------------------')
  console.log('ID:', insertedProduct.id)
  console.log('Name:', insertedProduct.name)
  console.log('Description:', insertedProduct.description)
  console.log('Gender:', insertedProduct.gender)
  console.log('Materials Used:', insertedProduct.materials_used)
  console.log('Collection Key:', insertedProduct.collection_key)
  console.log('Brand Key:', insertedProduct.brand_key)
  console.log('Is Limited Edition:', insertedProduct.is_limited_edition)
  console.log('Is New Arrival:', insertedProduct.is_new_arrival)
  console.log('Is Active:', insertedProduct.isActive)
  console.log('SEO Title:', insertedProduct.seoTitle)
  console.log('SEO Description:', insertedProduct.seoDescription)
  console.log('Slug:', insertedProduct.slug)
  console.log('Keywords:', insertedProduct.keywords)
  console.log('Amazon URL:', insertedProduct.amazon_url)
  console.log('Flipkart URL:', insertedProduct.flipkart_url)
  console.log('Created At:', insertedProduct.created_at)
  console.log('----------------------------------------------------\n')

  const issues = []
  if (!insertedProduct.name) issues.push('name is NULL')
  if (!insertedProduct.description) issues.push('description is NULL')
  if (!insertedProduct.gender) issues.push('gender is NULL')
  if (!insertedProduct.materials_used) issues.push('materials_used is NULL')
  if (!insertedProduct.slug) issues.push('slug is NULL')
  if (!insertedProduct.seoTitle) issues.push('seoTitle is NULL')

  if (issues.length > 0) {
    console.error('❌ TEST FAILED! Found null fields:', issues.join(', '))
  } else {
    console.log('🎉 ALL PRODUCT DETAILS SUCCESSFULLY ADDED & VERIFIED!')
  }

  // Clean up
  console.log('\n3. Cleaning up test record...')
  await supabase.from('product').delete().eq('id', insertedProduct.id)
  console.log('🧹 Cleaned up test product ID:', insertedProduct.id)
}

runTest()
