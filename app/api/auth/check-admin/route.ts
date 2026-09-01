import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Note: The ideal way to find a user by email securely is via a custom Postgres function.
    // For now, we rely on shouldCreateUser: false in the frontend to block non-existent users,
    // and the middleware to block existing non-admin users.
    // This route acts as a placeholder if you decide to implement a strict pre-validation RPC function in the future.
    // e.g. await supabaseAdmin.rpc('is_admin_email', { user_email: email })

    return NextResponse.json({ success: true, message: "Proceed to send OTP." })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
