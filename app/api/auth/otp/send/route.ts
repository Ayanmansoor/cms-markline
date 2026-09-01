import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const getTransporter = () => {
  const cleanPass = (process.env.SMTP_PASS || '').replace(/['"]/g, '').replace(/\s+/g, '')
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: cleanPass,
    },
  })
}

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

    // Check if user exists in auth.users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    if (usersError) throw new Error(usersError.message)

    const user = usersData.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())
    if (!user) {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 })
    }

    // Check if they are ADMIN
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      
    const isAdmin = roleData && roleData.some((r: any) => r.role === 'ADMIN')
      
    if (roleError || !isAdmin) {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Send email via nodemailer
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">CMS Admin Login</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Your one-time password (OTP) to login is:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This code will expire shortly. Do not share it with anyone.</p>
      </div>
    `

    await getTransporter().sendMail({
      from: `"Markline CMS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Admin Login OTP",
      html: htmlContent
    })

    const response = NextResponse.json({ success: true, message: "OTP sent" })

    // Store OTP and email in a secure HTTP-only cookie for verification
    // In production, you would hash the OTP. For this custom implementation, we use basic base64 encoding to obfuscate it in the cookie.
    const tokenPayload = Buffer.from(JSON.stringify({ email, otp, expires: Date.now() + 10 * 60 * 1000 })).toString('base64')
    
    response.cookies.set('custom_auth_otp', tokenPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    })

    return response
  } catch (error: any) {
    console.error("Error sending OTP email:", error)
    if (error.code === 'EAUTH' || error.responseCode === 535 || (error.message && error.message.includes('535'))) {
      return NextResponse.json({ 
        error: "Gmail SMTP Auth Error: The App Password (SMTP_PASS in .env) was rejected by Google (535 Bad Credentials). Please update SMTP_PASS in .env with a new Gmail 16-character App Password." 
      }, { status: 500 })
    }
    return NextResponse.json({ error: error.message || "Failed to send OTP email" }, { status: 500 })
  }
}
