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

async function inspectSchema() {
  console.log('Fetching sample variants from product_variants...')
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .limit(3)

  if (error) {
    console.error('Error fetching variants:', error)
    return
  }

  console.log('Sample Variants:')
  console.log(JSON.stringify(data, null, 2))
}

inspectSchema()
