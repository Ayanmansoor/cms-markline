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

async function testGet() {
  const { data, error } = await supabase
    .from('product')
    .select('*, product_variants(*)')
    .eq('id', 41)
    .single()

  if (error) {
    console.error('Get error:', error)
    return
  }

  console.log('Product 41 Data:')
  console.log(JSON.stringify(data, null, 2))
}

testGet()
