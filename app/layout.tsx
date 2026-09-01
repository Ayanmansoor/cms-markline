import { Geist, Geist_Mono } from "next/font/google"
import { SessionProvider } from "next-auth/react"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import QueryProvider from "@/components/providers/query-provider"
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.classList.add(t)}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        /> */}
        <QueryProvider>
          <SessionProvider>
            <ThemeProvider>
              <TooltipProvider delayDuration={0}>
                {children}
              </TooltipProvider>
            </ThemeProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
