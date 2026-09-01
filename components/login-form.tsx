'use client'

import { useState, useEffect, Suspense } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

function LoginFormContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "unauthorized") {
      toast.error("Access denied. You do not have admin privileges.")
    }
  }, [searchParams])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    const toastId = toast.loading("Checking permissions & sending OTP...")

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      setIsOtpSent(true)
      toast.success(`OTP code sent to ${email}! Please check your email inbox.`, {
        id: toastId,
        duration: 6000,
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP", {
        id: toastId,
        duration: 8000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    const toastId = toast.loading("Verifying OTP code...")

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token: otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      toast.success("OTP verified successfully!", { id: toastId })
      
      if (data.isAdmin) {
        toast.info("Admin detected, redirecting to dashboard...", { duration: 3000 })
        const nextAuthResult = await signIn("credentials", {
          email,
          role: "admin",
          redirect: false,
          callbackUrl: "/dashboard",
        })

        if (nextAuthResult?.error) {
          throw new Error(nextAuthResult.error)
        }
        
        router.push("/dashboard")
      } else {
        router.push("/")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify OTP", {
        id: toastId,
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="backdrop-blur-md bg-white/95 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Login to Markline Admin</CardTitle>
          <CardDescription>
            {isOtpSent ? "Enter the OTP sent to your email" : "Enter your email below to login via Custom OTP"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold mt-2" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">OTP Code</Label>
                <Input
                  id="token"
                  name="token"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6 digit code"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full font-bold"
                  onClick={() => setIsOtpSent(false)}
                  disabled={isLoading}
                >
                  Back to Email
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function LoginForm(props: React.ComponentProps<"div">) {
  return (
    <Suspense fallback={<div className="text-sm font-medium text-slate-500 animate-pulse text-center p-4">Loading login...</div>}>
      <LoginFormContent {...props} />
    </Suspense>
  )
}
