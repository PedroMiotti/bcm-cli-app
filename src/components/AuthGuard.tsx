"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace("/login")
    }
  }, [user, router])

  if (!user) return null
  return <>{children}</>
}
