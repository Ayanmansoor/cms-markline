import { createClient } from '@supabase/supabase-js'

export async function getUserMap() {
  const userMap = new Map<string, { name: string; email: string }>()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      const { data } = await supabaseAdmin.auth.admin.listUsers()
      data?.users?.forEach((u: any) => {
        userMap.set(u.id, {
          name: u.user_metadata?.full_name || u.user_metadata?.name || 'Customer',
          email: u.email || 'N/A'
        })
      })
    } catch (e) {
      console.error("Helper user map lookup failed:", e)
    }
  }
  return userMap
}
