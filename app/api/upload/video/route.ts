import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "demhgityh"
    const apiKey = process.env.CLOUDINARY_API_KEY || "612954749539815"
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "f5KdAyoTc05pHciZnF2N92MsmEI"

    const timestamp = Math.round(new Date().getTime() / 1000)
    const folder = 'shop_videos'

    // Calculate Cloudinary API signature (alphabetical order of parameters)
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto
      .createHash('sha1')
      .update(signatureStr)
      .digest('hex')

    // Create form data payload for Cloudinary endpoint
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('api_key', apiKey)
    cloudinaryFormData.append('timestamp', timestamp.toString())
    cloudinaryFormData.append('signature', signature)
    cloudinaryFormData.append('folder', folder)

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Cloudinary upload failed error payload:", data)
      return NextResponse.json({ error: data.error?.message || 'Cloudinary upload failed' }, { status: response.status })
    }

    // Optimize the returned Cloudinary URL
    let optimizedUrl = data.secure_url || data.url
    if (optimizedUrl && optimizedUrl.includes('cloudinary.com')) {
      // Inject formatting (f_auto) and quality (q_auto) parameters for dynamic transcoding
      optimizedUrl = optimizedUrl.replace('/video/upload/', '/video/upload/f_auto,q_auto/')
    }

    return NextResponse.json({ success: true, url: optimizedUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload file to Cloudinary' }, { status: 500 })
  }
}
