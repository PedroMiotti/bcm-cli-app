"use client"

import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { LogOut, ShieldCheck } from "lucide-react"
import Countdown from "./Countdown"
import UserAvatar from "./UserAvatar"

export default function Header() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 max-w-5xl mx-auto gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo-trupe.png"
            alt="Bolão Trupe"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-cover shrink-0"
          />
          <div className="flex items-center gap-1">
            <span className="font-black text-base text-foreground tracking-tight">BOLÃO TRUPE</span>
            <span className="font-black text-base orange-text tracking-tight">2026</span>
          </div>
        </div>

        {/* Countdown */}
        <Countdown />

        {/* User + logout */}
        <div className="flex items-center gap-2 shrink-0">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/15 transition-all duration-200"
              title="Painel Admin"
            >
              <ShieldCheck size={16} />
            </Link>
          )}
          {user && (
            <div className="bg-secondary/60 rounded-md px-3 py-1 border border-border/40">
              <UserAvatar
                displayName={user.displayName}
                description={user.username ?? user.description}
                size="sm"
              />
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
