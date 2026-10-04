import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"

interface ProductItem {
  name: string
  units: number
  price: string
  pct: string
  img?: string
  imgUrl?: string
}

interface TopSellingProductsProps {
  products: ProductItem[]
  onReportClick?: () => void
}

export function TopSellingProducts({ products, onReportClick }: TopSellingProductsProps) {
  return (
    <Card className="md:col-span-2 shadow-xs border border-slate-200/80 rounded-2xl bg-white">
      <CardHeader className="py-6">
        <CardTitle className="text-lg font-bold text-[#0f172a] leading-tight">
          Top Selling Products
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="">
          {products.length === 0 ? (
            <section className="py-2">
              <div className=" text-center pb-3 text-xs font-semibold text-slate-400">
                No top products recorded yet.
              </div>

              <Button
                variant="outline"
                onClick={onReportClick}
                className="w-full font-bold text-slate-700 border-slate-200/80 shadow-xs rounded-xl hover:bg-slate-50"
              >
                Inventory Report
              </Button>
            </section>
          ) : (
            products.map((product, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 shadow-xs shrink-0 overflow-hidden flex items-center justify-center">
                    {product.imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imgUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">
                      {product.name.length > 14 ? product.name.substring(0, 14) + "..." : product.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{product.units} Units Sold</p>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">{product.price}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-[13px] font-bold text-emerald-600 mb-1.5">{product.pct}</p>
                  <div className="w-12 h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: product.pct }}></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>


      </CardContent>
    </Card>
  )
}
