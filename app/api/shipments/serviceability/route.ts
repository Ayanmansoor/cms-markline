import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getShiprocketToken } from '@/lib/shiprocket'
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pickupPostcode = searchParams.get('pickup_postcode')
    const deliveryPostcode = searchParams.get('delivery_postcode')
    const weight = searchParams.get('weight') || '0.5'
    const cod = searchParams.get('cod') || '0'
    const isReturn = searchParams.get('is_return') || '0'
    const declaredValue = searchParams.get('declared_value') || searchParams.get('order_value') || '100'
    const orderId = searchParams.get('order_id')

    if (!pickupPostcode || !deliveryPostcode) {
      return NextResponse.json(
        { error: 'pickup_postcode and delivery_postcode are required' },
        { status: 400 }
      )
    }

    let token: string | null = null
    try {
      token = await getShiprocketToken()
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to obtain Shiprocket token.' },
        { status: 401 }
      )
    }

    let queryUrl = `${process.env.SHIPROCKET_API_URL}/courier/serviceability/?pickup_postcode=${encodeURIComponent(pickupPostcode)}&delivery_postcode=${encodeURIComponent(deliveryPostcode)}&weight=${encodeURIComponent(weight)}&cod=${encodeURIComponent(cod)}&is_return=${encodeURIComponent(isReturn)}&declared_value=${encodeURIComponent(declaredValue)}`

    if (orderId) {
      queryUrl += `&order_id=${encodeURIComponent(orderId)}`
    }

    const serviceabilityRes = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await serviceabilityRes.json()

    if (!serviceabilityRes.ok || data.status === 400) {
      return NextResponse.json(
        { error: data.message || data.data?.message || 'Failed to fetch serviceability from Shiprocket' },
        { status: serviceabilityRes.status || 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
