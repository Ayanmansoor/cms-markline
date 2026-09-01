import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function verifyUser() {
  const email = 'ayanmansoor@gmail.com'
  console.log(`Checking auth.users for ${email}...`)

  // 1. Fetch user by email via admin API
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (usersError) {
    console.error('Error fetching users:', usersError)
    return
  }

  const user = usersData.users.find(u => u.email === email)

  if (!user) {
    console.log(`User ${email} NOT FOUND in auth.users.`)
    console.log(`Because the user does not exist in auth.users, shouldCreateUser: false silently prevented the OTP from sending.`)
    return
  }

  console.log(`User FOUND in auth.users! ID: ${user.id}`)

  // 2. Check user_roles table
  console.log(`Checking public.user_roles for user_id ${user.id}...`)
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)

  if (roleError) {
    console.error('Error querying user_roles:', roleError)
    return
  }

  if (roleData && roleData.length > 0) {
    console.log(`User roles found:`, roleData)
  } else {
    console.log(`NO roles found in public.user_roles for this user.`)
  }
}

verifyUser()
