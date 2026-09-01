import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpdate() {
  console.log('Clearing and re-inserting variants for product 41...')
  
  // 1. Delete existing variants
  const { error: deleteError } = await supabase
    .from('product_variants')
    .delete()
    .eq('products_id', 41)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return
  }

  // 2. Insert new variants with mrp and retail_price
  const variantsToInsert = [
    {
      sku: 'SKU-593548',
      colors: [
        JSON.stringify({ name: 'Blush Pink', hex: '#E8B7B5' })
      ],
      sizes: [
        JSON.stringify({ size: '36', unit: 'EU' }),
        JSON.stringify({ size: '37', unit: 'EU' })
      ],
      stock: 50,
      image_url: [],
      is_active: true,
      mrp: 1299.00,
      retail_price: 1199.00,
      products_id: 41
    }
  ]

  const { data, error: insertError } = await supabase
    .from('product_variants')
    .insert(variantsToInsert)
    .select()

  if (insertError) {
    console.error('Insert error:', insertError)
    return
  }

  console.log('Update Successful! Inserted variants data:')
  console.log(JSON.stringify(data, null, 2))
}

testUpdate()
