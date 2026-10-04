import React from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Trash2Icon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { TableLoadingSkeleton } from "@/components/shared/loading-skeleton"
import { parseImageUrl } from "@/lib/utils"

interface BlogTableProps {
  blogs: any[]
  totalCount: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  isLoading: boolean
  onDelete: (id: number, title: string) => void
}

export function BlogTable({
  blogs,
  totalCount,
  currentPage,
  limit,
  onPageChange,
  isLoading,
  onDelete,
}: BlogTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} columns={5} />
  }

  if (!blogs || blogs.length === 0) {
    return (
      <EmptyState
        title="No blog posts found"
        description="Try adjusting your filter settings or create a new blog post."
      />
    )
  }

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <Card className="border">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Article Title</TableHead>
                <TableHead className="text-xs font-semibold">Category / Tag</TableHead>
                <TableHead className="text-xs font-semibold">Author</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Published Date</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.map((blog) => {
                const imgUrl = parseImageUrl(blog.banner_image || blog.image || blog.image_url)
                const isPublished = blog.status?.toLowerCase() === "published" || blog.is_published === true

                return (
                  <TableRow key={blog.id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-medium py-3">
                      <div className="flex items-center gap-3">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={blog.title}
                            className="w-10 h-10 rounded-md object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-semibold border">
                            Blog
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground line-clamp-1">{blog.title}</p>
                          <p className="text-[11px] text-muted-foreground">/{blog.slug || blog.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{blog.category || blog.tag || "General"}</TableCell>
                    <TableCell>{blog.author || "Editorial Team"}</TableCell>
                    <TableCell>
                      <Badge variant={isPublished ? "default" : "secondary"} className="text-[10px]">
                        {isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {blog.created_at ? new Date(blog.created_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/blogs/${blog.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => onDelete(blog.id, blog.title)}
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
          <p>
            Page {currentPage} of {totalPages} ({totalCount} total articles)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
