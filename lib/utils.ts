import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseImageUrl(val: any): string {
  if (!val) return ""

  if (typeof val === "string") {
    let trimmed = val.trim()
    if (!trimmed) return ""

    // If it's a JSON stringified object or array, attempt parsing
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed)
        return parseImageUrl(parsed)
      } catch {
        return ""
      }
    }

    // Direct HTTP(S) URL
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed
    }

    // Blob or data URL
    if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
      return trimmed
    }

    // Relative path starting with slash (e.g. /uploads/...)
    if (trimmed.startsWith("/")) {
      return trimmed
    }

    // Domain or filename with extension (e.g. sandals-1.png)
    if (trimmed.includes(".") && !trimmed.includes(" ")) {
      const cleanPath = trimmed.replace(/^\/+/, '')
      return `https://raw.githubusercontent.com/Ayandev1/image/main/${cleanPath}`
    }

    return ""
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return ""
    return parseImageUrl(val[0])
  }

  if (typeof val === "object") {
    const urlCandidate =
      val.download_url ||
      val.url ||
      val.Url ||
      val.image_url ||
      val.imageUrl ||
      val.src ||
      val.image ||
      val.path ||
      val.logo ||
      val.logo_url ||
      ""
    if (urlCandidate) {
      return parseImageUrl(urlCandidate)
    }
  }

  return ""
}

export function getFulfillmentStatusBadge(status?: string) {
  const s = String(status || 'Pending').trim()
  const lower = s.toLowerCase()

  switch (lower) {
    case 'pending':
    case 'unfulfilled':
      return {
        label: s === 'unfulfilled' ? 'Unfulfilled' : 'Pending',
        className: 'bg-amber-50 text-amber-700 border-amber-200/90 hover:bg-amber-100 font-bold'
      }
    case 'confirmed':
      return {
        label: 'Confirmed',
        className: 'bg-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100 font-bold'
      }
    case 'packed':
      return {
        label: 'Packed',
        className: 'bg-purple-50 text-purple-700 border-purple-200/90 hover:bg-purple-100 font-bold'
      }
    case 'ready to ship':
    case 'ready_to_ship':
      return {
        label: 'Ready To Ship',
        className: 'bg-sky-50 text-sky-700 border-sky-200/90 hover:bg-sky-100 font-bold'
      }
    case 'shipped':
    case 'in transit':
    case 'in_transit':
      return {
        label: 'Shipped',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200/90 hover:bg-indigo-100 font-bold'
      }
    case 'delivered':
      return {
        label: 'Delivered',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100 font-bold'
      }
    case 'completed':
    case 'fulfilled':
      return {
        label: s.toLowerCase() === 'fulfilled' ? 'Fulfilled' : 'Completed',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 font-extrabold'
      }
    case 'cancelled':
    case 'canceled':
      return {
        label: 'Cancelled',
        className: 'bg-rose-50 text-rose-700 border-rose-200/90 hover:bg-rose-100 font-bold'
      }
    default:
      return {
        label: s,
        className: 'bg-slate-50 text-slate-700 border-slate-200 font-bold'
      }
  }
}
