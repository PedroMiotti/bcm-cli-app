"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Trophy, Calendar, Award, BookOpen, Swords } from "lucide-react"

const tabs = [
  { href: "/jogos",        label: "JOGOS",   Icon: Calendar },
  { href: "/ranking",      label: "RANKING", Icon: Trophy   },
  { href: "/chaveamento",  label: "CHAVE",   Icon: Swords   },
  { href: "/premios",      label: "PRÊMIOS", Icon: Award    },
  { href: "/regras",       label: "REGRAS",  Icon: BookOpen },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-md">
      <div className="flex h-16 max-w-5xl mx-auto px-2">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wide transition-all duration-200 ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`flex flex-col items-center justify-center w-12 h-9 rounded-xl transition-all duration-200 ${
                active ? "bg-primary/15" : "hover:bg-secondary"
              }`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
