import React from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateShipmentFormValues {
  orderId: string
  warehouseId: string
  courierName: string
  courierId: string
  weight: string
  length: string
  breadth: string
  height: string
  remarks: string
}

interface ShipmentCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (values: any) => void
  warehouses: any[]
  unshippedOrders: any[]
  isPending?: boolean
}

export function ShipmentCreateDialog({
  isOpen,
  onClose,
  onSuccess,
  warehouses,
  unshippedOrders,
  isPending,
}: ShipmentCreateDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateShipmentFormValues>({
    defaultValues: {
      orderId: "",
      warehouseId: "",
      courierName: "",
      courierId: "",
      weight: "0.5",
      length: "10",
      breadth: "10",
      height: "10",
      remarks: "",
    },
  })

  const selectedWarehouseId = watch("warehouseId")
  const selectedOrderId = watch("orderId")

  const onSubmitForm = (data: CreateShipmentFormValues) => {
    onSuccess(data)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Create New Shipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 text-xs mt-2">
          <div>
            <label className="font-medium text-foreground block mb-1">Select Unshipped Order</label>
            <Select value={selectedOrderId} onValueChange={(val) => setValue("orderId", val)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choose order" />
              </SelectTrigger>
              <SelectContent>
                {unshippedOrders.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    Order #{o.id} ({o.customer_name || "Guest"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="font-medium text-foreground block mb-1">Warehouse</label>
            <Select value={selectedWarehouseId} onValueChange={(val) => setValue("warehouseId", val)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choose dispatch warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name} ({w.pincode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-foreground block mb-1">Courier Partner</label>
              <Input {...register("courierName")} placeholder="e.g. Blue Dart, Delhivery" className="h-8 text-xs" />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Weight (kg)</label>
              <Input {...register("weight")} placeholder="0.5" className="h-8 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-medium text-foreground block mb-1">Length (cm)</label>
              <Input {...register("length")} className="h-8 text-xs" />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Breadth (cm)</label>
              <Input {...register("breadth")} className="h-8 text-xs" />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Height (cm)</label>
              <Input {...register("height")} className="h-8 text-xs" />
            </div>
          </div>

          <DialogFooter className="pt-4 flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="h-8 text-xs">
              {isPending ? "Dispatching..." : "Dispatch Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
