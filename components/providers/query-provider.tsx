"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, ReactNode } from "react"

export default function ({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
            gcTime: 1000 * 60 * 10,   // Keep unused cache for 10 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
