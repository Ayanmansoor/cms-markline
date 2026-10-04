"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { X, Plus, Trash2, Search, Package, Loader2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface ProductItem {
  productId: string
  productName: string
  productImage: string | null
  variantId: string | null
  sku: string | null
  color: string | null
  size: string | null
  unitPrice: number
  quantity: number
  discountAmount: number
  finalPrice: number
  stock: number
}

interface OrderFormState {
  userId: string
  addressId: string
  paymentStatus: string
  paymentMethod: string
  shippingCharge: number
  discountAmount: number
  taxAmount: number
  couponCode: string
  customerNote: string
  items: ProductItem[]
}

interface CreateOrderModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  onSuccess?: () => void
}

import { Checkbox } from "@/components/ui/checkbox"

export function CreateOrderModal({ open, onOpenChange, onClose, onSuccess }: CreateOrderModalProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<OrderFormState>({
    userId: "",
    addressId: "",
    paymentStatus: "PENDING",
    paymentMethod: "razorpay",
    shippingCharge: 150,
    discountAmount: 0,
    taxAmount: 0,
    couponCode: "",
    customerNote: "",
    items: []
  })

  // Customer selection states
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const customerInputRef = useRef<HTMLInputElement>(null)

  // Product multi-selection states
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedProductName, setSelectedProductName] = useState("")
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null)
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [selectedVariantsMap, setSelectedVariantsMap] = useState<Record<string, boolean>>({})

  // Fetch registered customers list
  const { data: customerData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customersList"],
    queryFn: async () => {
      const res = await fetch("/api/customers?limit=100")
      if (!res.ok) throw new Error("Failed to fetch customers")
      return res.json()
    },
    enabled: open
  })
  const customersList = customerData?.customers || []

  // Fetch addresses list
  const { data: addressData, isLoading: loadingAddresses } = useQuery({
    queryKey: ["addressesList"],
    queryFn: async () => {
      const res = await fetch("/api/customers/addresses")
      if (!res.ok) throw new Error("Failed to fetch addresses")
      return res.json()
    },
    enabled: open
  })
  const allAddresses = addressData?.addresses || []

  // Filter addresses for selected customer locally
  const customerAddresses = React.useMemo(() => {
    if (!form.userId) return []
    return allAddresses.filter((addr: any) => addr.user_id === form.userId)
  }, [form.userId, allAddresses])

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearchQuery.trim()) return customersList
    const q = customerSearchQuery.toLowerCase()
    return customersList.filter((c: any) =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [customerSearchQuery, customersList])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setForm({
        userId: "",
        addressId: "",
        paymentStatus: "PENDING",
        paymentMethod: "razorpay",
        shippingCharge: 150,
        discountAmount: 0,
        taxAmount: 0,
        couponCode: "",
        customerNote: "",
        items: []
      })
      setSearchQuery("")
      setActiveItemIndex(null)
      setCustomerSearchQuery("")
      setIsCustomerDropdownOpen(false)
      setSelectedProductId(null)
      setSelectedProductName("")
      setSelectedProductImage(null)
      setProductSearchOpen(false)
      setSelectedVariantsMap({})
    }
  }, [open])

  // Product search query
  const { data: productData, isLoading: searchingProducts } = useQuery({
    queryKey: ["productSearch", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { products: [] }
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      if (!res.ok) throw new Error("Failed to search products")
      return res.json()
    },
    enabled: searchQuery.trim().length >= 1,
    staleTime: 3000,
  })
  const products = productData?.products || []

  // Fetch variants for selected active product
  const { data: activeProductVariants, isLoading: loadingActiveVariants } = useQuery({
    queryKey: ["activeVariants", selectedProductId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${selectedProductId}/variants`)
      if (!res.ok) throw new Error("Failed to fetch variants")
      return res.json()
    },
    enabled: !!selectedProductId
  })
  const activeVariants = activeProductVariants?.variants || []

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async (payload: OrderFormState) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: payload.userId || null,
          addressId: payload.addressId || null,
          paymentStatus: payload.paymentStatus,
          paymentMethod: payload.paymentMethod,
          subtotal: totals.subtotal,
          discountAmount: payload.discountAmount,
          shippingCharge: payload.shippingCharge,
          taxAmount: payload.taxAmount,
          grandTotal: totals.grandTotal,
          couponCode: payload.couponCode || null,
          customerNote: payload.customerNote || null,
          items: payload.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount || null,
            finalPrice: item.finalPrice,
            color: item.color,
            size: item.size
          }))
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create order")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`Order ${data.order.displayId || data.order.id} created successfully!`)
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      onOpenChange?.(false)
      onClose?.()
      onSuccess?.()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create order")
    }
  })

  // Add a new product item row
  const handleAddProduct = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: "",
        productName: "",
        productImage: null,
        variantId: null,
        sku: null,
        color: null,
        size: null,
        unitPrice: 0,
        quantity: 1,
        discountAmount: 0,
        finalPrice: 0,
        stock: 0
      }]
    }))
    setActiveItemIndex(form.items.length)
    setSearchQuery("")
  }

  // Add selected variants as separate items in form
  const handleAddSelectedVariants = () => {
    const newItems: ProductItem[] = []
    activeVariants.forEach((v: any) => {
      if (selectedVariantsMap[String(v.id)]) {
        const exists = form.items.some(item => item.variantId === String(v.id))
        if (!exists) {
          const color = v.colors?.[0] || null
          const size = v.sizes?.[0] || null
          newItems.push({
            productId: selectedProductId!,
            productName: selectedProductName,
            productImage: selectedProductImage || v.imageUrl,
            variantId: String(v.id),
            sku: v.sku,
            color,
            size,
            unitPrice: v.price,
            quantity: 1,
            discountAmount: 0,
            finalPrice: v.price,
            stock: v.stock
          })
        }
      }
    })

    if (newItems.length > 0) {
      setForm(prev => ({
        ...prev,
        items: [...prev.items, ...newItems]
      }))
      toast.success(`Added ${newItems.length} items to order list.`)
    } else {
      toast.info("No new items were added.")
    }

    // Reset selection state
    setSelectedProductId(null)
    setSelectedProductName("")
    setSelectedProductImage(null)
    setSelectedVariantsMap({})
    setSearchQuery("")
  }

  // Update item field
  const updateItem = (index: number, field: keyof ProductItem, value: any) => {
    setForm(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }

      // Recalculate final price
      if (field === "quantity" || field === "unitPrice" || field === "discountAmount") {
        const qty = field === "quantity" ? value : items[index].quantity
        const price = field === "unitPrice" ? value : items[index].unitPrice
        const discount = field === "discountAmount" ? value : items[index].discountAmount
        items[index].finalPrice = Math.max(0, (price * qty) - discount)
      }

      return { ...prev, items }
    })
  }

  // Remove an item
  const removeItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
    if (activeItemIndex === index) {
      setActiveItemIndex(null)
    } else if (activeItemIndex !== null && activeItemIndex > index) {
      setActiveItemIndex(activeItemIndex - 1)
    }
  }

  // Calculate totals
  const totals = React.useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const itemDiscount = form.items.reduce((sum, item) => sum + item.discountAmount, 0)
    const afterItemDiscount = subtotal - itemDiscount
    const afterShipping = afterItemDiscount + form.shippingCharge
    const afterTax = afterShipping + form.taxAmount
    const grandTotal = afterTax - form.discountAmount
    return {
      subtotal,
      itemDiscount,
      afterItemDiscount,
      shipping: form.shippingCharge,
      tax: form.taxAmount,
      discount: form.discountAmount,
      grandTotal: Math.max(0, grandTotal)
    }
  }, [form.items, form.shippingCharge, form.taxAmount, form.discountAmount])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val)
  }

  const canSubmit = form.items.length > 0 && 
                    form.items.every(item => item.productId && item.quantity > 0) &&
                    form.userId !== "" &&
                    form.addressId !== ""

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange?.(val); if (!val) onClose?.(); }}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Create New Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  ref={customerInputRef}
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value)
                    setIsCustomerDropdownOpen(true)
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder={form.userId ? "Search customer..." : "Type customer name/email..."}
                  className="text-xs border-slate-200 pl-9 pr-8 !text-black h-10 shadow-sm"
                />
                {form.userId && (
                  <div className="absolute right-3 top-3 text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <span>Selected</span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, userId: "", addressId: "" }))
                        setCustomerSearchQuery("")
                      }}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {isCustomerDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {loadingCustomers ? (
                    <div className="p-3 text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading customers...
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No customers found</div>
                  ) : (
                    filteredCustomers.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-3 py-2.5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setForm(prev => ({ ...prev, userId: c.id, addressId: "" }))
                          setCustomerSearchQuery(c.name)
                          setIsCustomerDropdownOpen(false)
                        }}
                      >
                        <p className="text-xs font-bold text-slate-900 leading-tight">{c.name}</p>
                        <p className="text-[10px] text-blue-600 truncate mt-0.5">{c.email}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
                Shipping Address <span className="text-red-500">*</span>
              </label>
              {!form.userId ? (
                <div className="h-10 px-3 flex items-center text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-md">
                  Please select a customer first
                </div>
              ) : loadingAddresses ? (
                <div className="h-10 px-3 flex items-center text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-md">
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Loading addresses...
                </div>
              ) : customerAddresses.length === 0 ? (
                <div className="h-10 px-3 flex items-center text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-md">
                  Customer has no addresses saved
                </div>
              ) : (
                <select
                  value={form.addressId}
                  onChange={(e) => setForm(prev => ({ ...prev, addressId: e.target.value }))}
                  className="w-full h-10 px-3 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select shipping address...</option>
                  {customerAddresses.map((addr: any) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.recipientName} ({addr.recipientPhone}) - {addr.full_address}, {addr.city}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Add Products Section */}
          <Card className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl">
            <h4 className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-2.5">
              Add Products & Variants
            </h4>
            
            <div className="relative">
              <label className="text-[10px] font-semibold text-slate-500 block mb-1.5">Search Product</label>
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setProductSearchOpen(true)
                  }}
                  onFocus={() => setProductSearchOpen(true)}
                  placeholder={selectedProductId ? `Selected: ${selectedProductName}` : "Type product name to search..."}
                  className="text-xs border-slate-200 pl-9 pr-8 !text-black h-10 shadow-sm"
                />
                {selectedProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductId(null)
                      setSelectedProductName("")
                      setSelectedProductImage(null)
                      setSelectedVariantsMap({})
                      setSearchQuery("")
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {productSearchOpen && products.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {products.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0"
                      onClick={() => {
                        setSelectedProductId(p.id)
                        setSelectedProductName(p.name)
                        setSelectedProductImage(p.image)
                        setProductSearchOpen(false)
                        setSearchQuery(p.name)
                        setSelectedVariantsMap({})
                      }}
                    >
                      {p.image && (
                        <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-slate-700">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Checklist of Variants */}
            {selectedProductId && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <label className="text-[10px] font-bold text-slate-600 capitalize tracking-wider block mb-2">
                  Select Variants to Add
                </label>
                
                {loadingActiveVariants ? (
                  <div className="py-4 text-xs font-semibold text-slate-400 text-center flex items-center justify-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading variants...
                  </div>
                ) : activeVariants.length === 0 ? (
                  <p className="text-xs font-semibold text-red-500 py-2">No variants found for this product.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                      {activeVariants.map((v: any) => {
                        const label = [
                          v.colors?.[0],
                          v.sizes?.[0],
                          v.sku
                        ].filter(Boolean).join(" / ") || `Variant #${v.id}`
                        const isChecked = !!selectedVariantsMap[String(v.id)]
                        
                        return (
                          <div 
                            key={v.id} 
                            onClick={() => {
                              setSelectedVariantsMap(prev => ({
                                ...prev,
                                [String(v.id)]: !prev[String(v.id)]
                              }))
                            }}
                            className={`flex items-center justify-between p-2.5 border rounded-lg hover:bg-white cursor-pointer transition-all ${
                              isChecked ? "border-blue-300 bg-blue-50/20" : "border-slate-200 bg-white/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={isChecked} 
                                onCheckedChange={(checked) => {
                                  setSelectedVariantsMap(prev => ({
                                    ...prev,
                                    [String(v.id)]: !!checked
                                  }))
                                }}
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900">{label}</p>
                                <p className="text-[10px] text-slate-500">
                                  Stock: <span className={v.stock > 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>{v.stock} units</span>
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-blue-700">{formatCurrency(v.price)}</span>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        onClick={handleAddSelectedVariants}
                        disabled={Object.values(selectedVariantsMap).filter(Boolean).length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9"
                      >
                        Add Checked Variants ({Object.values(selectedVariantsMap).filter(Boolean).length})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 capitalize tracking-wider">
                Order Items ({form.items.length})
              </h4>
            </div>

            {form.items.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-white">
                <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No products added yet. Select a product above to add variants.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {/* Product image */}
                      <div className="w-12 h-12 rounded-md border border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h5>
                            {item.sku && (
                              <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-500 font-bold mt-0.5">
                                {item.sku}
                              </Badge>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeItem(index) }}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Adjust item details */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 capitalize tracking-wider mb-1 block">Color</label>
                            <Input
                              value={item.color || ""}
                              onChange={(e) => updateItem(index, "color", e.target.value || null)}
                              placeholder="Color"
                              className="h-8 text-[11px] border-slate-200 !text-black shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 capitalize tracking-wider mb-1 block">Size</label>
                            <Input
                              value={item.size || ""}
                              onChange={(e) => updateItem(index, "size", e.target.value || null)}
                              placeholder="Size"
                              className="h-8 text-[11px] border-slate-200 !text-black shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 capitalize tracking-wider mb-1 block">Qty</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                              className="h-8 text-[11px] border-slate-200 !text-black shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 capitalize tracking-wider mb-1 block">Unit Price</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-8 text-[11px] border-slate-200 !text-black shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 capitalize tracking-wider mb-1 block">Discount</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discountAmount}
                              onChange={(e) => updateItem(index, "discountAmount", parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="h-8 text-[11px] border-slate-200 !text-black shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end mt-2 text-[10px] font-bold text-slate-500">
                          Item Total: <span className="text-slate-900 ml-1">{formatCurrency(item.finalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment & Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
                Payment Status
              </label>
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
                Payment Method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-white shadow-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="razorpay">Razorpay</option>
                <option value="cod">Cash on Delivery</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
                Coupon Code
              </label>
              <Input
                value={form.couponCode}
                onChange={(e) => setForm(prev => ({ ...prev, couponCode: e.target.value }))}
                placeholder="Optional"
                className="text-xs border-slate-200 !text-black h-10 shadow-sm"
              />
            </div>
          </div>

          {/* Financial Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
                Shipping Charge
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.shippingCharge}
                onChange={(e) => setForm(prev => ({ ...prev, shippingCharge: parseFloat(e.target.value) || 0 }))}
                className="text-xs border-slate-200 !text-black h-10 shadow-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
                Tax Amount
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.taxAmount}
                onChange={(e) => setForm(prev => ({ ...prev, taxAmount: parseFloat(e.target.value) || 0 }))}
                className="text-xs border-slate-200 !text-black h-10 shadow-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
                Discount Amount
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.discountAmount}
                onChange={(e) => setForm(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                className="text-xs border-slate-200 !text-black h-10 shadow-sm"
              />
            </div>
          </div>

          {/* Customer Note */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-1.5 block">
              Customer Note
            </label>
            <textarea
              value={form.customerNote}
              onChange={(e) => setForm(prev => ({ ...prev, customerNote: e.target.value }))}
              placeholder="Optional note from customer..."
              className="w-full h-16 p-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md shadow-sm outline-none resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Order Summary */}
          {form.items.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-[10px] font-bold text-slate-500 capitalize tracking-wider mb-3">Order Summary</h4>
              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal ({form.items.length} items)</span>
                  <span className="text-slate-900">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.itemDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Item Discount</span>
                    <span className="text-red-500">-{formatCurrency(totals.itemDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span className="text-slate-900">{formatCurrency(totals.shipping)}</span>
                </div>
                {totals.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax</span>
                    <span className="text-slate-900">{formatCurrency(totals.tax)}</span>
                  </div>
                )}
                {totals.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coupon Discount</span>
                    <span className="text-red-500">-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm font-bold text-slate-900">Grand Total</span>
                  <span className="text-sm font-black text-blue-700">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            onClick={() => { onOpenChange?.(false); onClose?.(); }}
            className="text-xs font-bold border-slate-200 text-slate-600 bg-white"
          >
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || createMutation.isPending}
            onClick={() => createMutation.mutate(form)}
            className="text-xs font-bold bg-black text-white hover:bg-black/90"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              "Create Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
