"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { LogOut, ShieldCheck, Trophy } from "lucide-react"
import Countdown from "./Countdown"
import UserAvatar from "./UserAvatar"
import RetrospectivaModal from "./RetrospectivaModal"

const RETRO_KEY = "bolao:retro_grupo_v1"

export default function Header() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [retroOpen, setRetroOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(RETRO_KEY)) return
    const t = setTimeout(() => setRetroOpen(true), 800)
    return () => clearTimeout(t)
  }, [])

  function handleRetroClose() {
    setRetroOpen(false)
    localStorage.setItem(RETRO_KEY, "1")
  }

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <>
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

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setRetroOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-yellow-400 hover:bg-yellow-400/15 transition-all duration-200"
              title="Retrospecto da Fase de Grupos"
            >
              <Trophy size={16} />
            </button>

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

      <RetrospectivaModal open={retroOpen} onClose={handleRetroClose} />
    </>
  )
}
