"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, SearchIcon, XIcon, ShoppingBagIcon, BookOpenIcon, PackageIcon } from "lucide-react"

interface ProductItem {
  id: number
  name: string
}

interface BlogItem {
  id: number
  title: string
}

interface RelationsPanelProps {
  selectedProducts: ProductItem[]
  selectedBlogs: BlogItem[]
  onProductsChange: (items: ProductItem[]) => void
  onBlogsChange: (items: BlogItem[]) => void
  currentBlogId?: number
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ── Product Multi-Select ───────────────────────────────────────────────────────

function ProductSelector({
  selected,
  onChange,
}: {
  selected: ProductItem[]
  onChange: (items: ProductItem[]) => void
}) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<ProductItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(search, 300)

  const selectedIds = new Set(selected.map(p => p.id))

  const fetchProducts = useCallback(async (q: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/filter?search=${encodeURIComponent(q)}&limit=20`)
      if (!res.ok) return
      const data = await res.json()
      setResults((data.products || []).filter((p: ProductItem) => !selectedIds.has(p.id)))
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [selectedIds])

  useEffect(() => {
    if (isOpen) {
      fetchProducts(debouncedSearch)
    }
  }, [debouncedSearch, isOpen, fetchProducts])

  const handleSelect = (product: ProductItem) => {
    onChange([...selected, product])
    setSearch("")
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleRemove = (id: number) => {
    onChange(selected.filter(p => p.id !== id))
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div>
      <div className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            ref={inputRef}
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search products..."
            className="h-9 pl-8 text-xs font-medium border-slate-200 bg-slate-50 focus:bg-white"
          />
          {isLoading && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {results.length === 0 && !isLoading ? (
              <div className="px-3 py-4 text-center">
                <PackageIcon className="h-5 w-5 text-slate-300 mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-slate-400">
                  {search ? "No products found" : "Type to search products"}
                </p>
              </div>
            ) : (
              results.map(product => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2 border-b border-slate-50 last:border-0"
                >
                  <ShoppingBagIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{product.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map(product => (
            <div
              key={product.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-semibold max-w-[180px]"
            >
              <ShoppingBagIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{product.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(product.id)}
                className="ml-0.5 text-blue-400 hover:text-blue-700 shrink-0 transition-colors"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="mt-2 text-[10px] text-slate-400 font-medium">No products linked yet.</p>
      )}
    </div>
  )
}

// ── Blog Multi-Select ──────────────────────────────────────────────────────────

function BlogSelector({
  selected,
  onChange,
  currentBlogId,
}: {
  selected: BlogItem[]
  onChange: (items: BlogItem[]) => void
  currentBlogId?: number
}) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<BlogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(search, 300)

  const selectedIds = new Set(selected.map(b => b.id))

  const fetchBlogs = useCallback(async (q: string) => {
    setIsLoading(true)
    try {
      let url = `/api/blogs/filter?search=${encodeURIComponent(q)}&limit=20`
      if (currentBlogId) url += `&exclude=${currentBlogId}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      setResults((data.blogs || []).filter((b: BlogItem) => !selectedIds.has(b.id)))
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [selectedIds, currentBlogId])

  useEffect(() => {
    if (isOpen) {
      fetchBlogs(debouncedSearch)
    }
  }, [debouncedSearch, isOpen, fetchBlogs])

  const handleSelect = (blog: BlogItem) => {
    onChange([...selected, blog])
    setSearch("")
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleRemove = (id: number) => {
    onChange(selected.filter(b => b.id !== id))
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div>
      <div className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            ref={inputRef}
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search blogs..."
            className="h-9 pl-8 text-xs font-medium border-slate-200 bg-slate-50 focus:bg-white"
          />
          {isLoading && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {results.length === 0 && !isLoading ? (
              <div className="px-3 py-4 text-center">
                <BookOpenIcon className="h-5 w-5 text-slate-300 mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-slate-400">
                  {search ? "No blogs found" : "Type to search blogs"}
                </p>
              </div>
            ) : (
              results.map(blog => (
                <button
                  key={blog.id}
                  type="button"
                  onClick={() => handleSelect(blog)}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors flex items-center gap-2 border-b border-slate-50 last:border-0"
                >
                  <BookOpenIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{blog.title}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map(blog => (
            <div
              key={blog.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-md text-[11px] font-semibold max-w-[180px]"
            >
              <BookOpenIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{blog.title}</span>
              <button
                type="button"
                onClick={() => handleRemove(blog.id)}
                className="ml-0.5 text-violet-400 hover:text-violet-700 shrink-0 transition-colors"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="mt-2 text-[10px] text-slate-400 font-medium">No related blogs linked yet.</p>
      )}
    </div>
  )
}

// ── Main RelationsPanel ────────────────────────────────────────────────────────

export function RelationsPanel({
  selectedProducts,
  selectedBlogs,
  onProductsChange,
  onBlogsChange,
  currentBlogId,
}: RelationsPanelProps) {
  return (
    <Card className="shadow-sm border border-slate-200 rounded-xl bg-white">
      <CardContent className="p-5 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-blue-50 border border-blue-100 flex items-center justify-center">
              <ShoppingBagIcon className="h-3 w-3 text-blue-600" />
            </span>
            Related Products
            {selectedProducts.length > 0 && (
              <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                {selectedProducts.length}
              </span>
            )}
          </h3>
          <Label className="text-[10px] font-bold text-slate-500 capitalize tracking-widest block mb-2">
            Link Products
          </Label>
          <ProductSelector selected={selectedProducts} onChange={onProductsChange} />
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-violet-50 border border-violet-100 flex items-center justify-center">
              <BookOpenIcon className="h-3 w-3 text-violet-600" />
            </span>
            Related Blogs
            {selectedBlogs.length > 0 && (
              <span className="ml-auto text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                {selectedBlogs.length}
              </span>
            )}
          </h3>
          <Label className="text-[10px] font-bold text-slate-500 capitalize tracking-widest block mb-2">
            Link Blogs
          </Label>
          <BlogSelector
            selected={selectedBlogs}
            onChange={onBlogsChange}
            currentBlogId={currentBlogId}
          />
        </div>
      </CardContent>
    </Card>
  )
}
