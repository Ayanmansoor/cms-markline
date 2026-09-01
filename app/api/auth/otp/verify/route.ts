import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json()
    
    console.log("Verify OTP request received:", { email, token })

    if (!email || !token) {
      console.log("Verification failed: Missing email or token")
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const cookieVal = cookieStore.get('custom_auth_otp')?.value

    if (!cookieVal) {
      console.log("Verification failed: No custom_auth_otp cookie found")
      return NextResponse.json({ error: "OTP expired or invalid. Please request a new one." }, { status: 400 })
    }

    const payload = JSON.parse(Buffer.from(cookieVal, 'base64').toString('utf-8'))
    console.log("Cookie payload retrieved:", payload)

    if (payload.email.toLowerCase() !== email.toLowerCase() || payload.otp !== token) {
      console.log("Verification failed: Mismatched OTP or Email", {
        expectedEmail: payload.email,
        receivedEmail: email,
        expectedOtp: payload.otp,
        receivedOtp: token
      })
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 })
    }

    if (Date.now() > payload.expires) {
      console.log("Verification failed: OTP has expired")
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
    }

    console.log("Verification successful for:", email)
    const response = NextResponse.json({ success: true, isAdmin: true })
    
    // Clear the OTP cookie now that it's verified
    response.cookies.delete('custom_auth_otp')

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to verify OTP" }, { status: 500 })
  }
}
