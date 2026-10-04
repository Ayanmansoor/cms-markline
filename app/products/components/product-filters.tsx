import React from "react"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductFilterOptions } from "../types/product-types"

interface ProductFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  selectedBrand: string
  onBrandChange: (val: string) => void
  selectedCollection: string
  onCollectionChange: (val: string) => void
  selectedGender: string
  onGenderChange: (val: string) => void
  selectedGroup: string
  onGroupChange: (val: string) => void
  filterOptions?: ProductFilterOptions
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  searchInputRef,
  selectedBrand,
  onBrandChange,
  selectedCollection,
  onCollectionChange,
  selectedGender,
  onGenderChange,
  selectedGroup,
  onGroupChange,
  filterOptions,
}: ProductFiltersProps) {
  const brandsList = filterOptions?.brands || []
  const collectionsList = filterOptions?.collections || []
  const groupsList = filterOptions?.groups || []

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search products by name, SKU, brand... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 shadow-xs"
        />
      </div>

      {/* Select Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={selectedBrand} onValueChange={onBrandChange}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brandsList.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCollection} onValueChange={onCollectionChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collectionsList.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedGender} onValueChange={onGenderChange}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="MEN">Men</SelectItem>
            <SelectItem value="WOMEN">Women</SelectItem>
            <SelectItem value="UNISEX">Unisex</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedGroup} onValueChange={onGroupChange}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groupsList.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.heading}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
