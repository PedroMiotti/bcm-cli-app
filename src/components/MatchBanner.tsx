"use client"

import { useEffect, useState } from "react"
import { Radio } from "lucide-react"
import type { Match } from "@/lib/types"

const DEADLINE = new Date("2026-06-11T12:00:00Z")

function getFeaturedMatch(matches: Match[]): { match: Match; isLive: boolean } | null {
  const live = matches.find((m) => m.status === "live")
  if (live) return { match: live, isLive: true }

  const now = Date.now()
  const upcoming = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const next =
    upcoming.find((m) => new Date(m.scheduledAt).getTime() > now) ?? upcoming[0]
  if (!next) return null
  return { match: next, isLive: false }
}

function formatMatchTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso))
}

export default function MatchBanner() {
  const [featured, setFeatured] = useState<{ match: Match; isLive: boolean } | null>(null)
  const [deadlinePassed, setDeadlinePassed] = useState(() => new Date() >= DEADLINE)

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/matches")
      const matches: Match[] = await res.json()
      setFeatured(getFeaturedMatch(matches))
    }
    load()
    const dataInterval = setInterval(load, 60_000)
    const tickInterval = setInterval(() => setDeadlinePassed(new Date() >= DEADLINE), 30_000)
    return () => {
      clearInterval(dataInterval)
      clearInterval(tickInterval)
    }
  }, [])

  if (!featured || (!deadlinePassed && !featured.isLive)) return null

  const { match, isLive } = featured
  const { homeTeam, awayTeam, result } = match
  const hasScore = result.homeGoals !== null && result.awayGoals !== null

  return (
    <div className="border-b border-border/60 bg-primary/5 px-4 py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm min-w-0">
        {isLive ? (
          <span className="flex items-center gap-1 font-bold text-primary uppercase tracking-wide shrink-0">
            <Radio size={12} className="animate-pulse" />
            Ao vivo
          </span>
        ) : (
          <span className="font-semibold text-muted-foreground shrink-0">
            Próximo · {formatMatchTime(match.scheduledAt)}
          </span>
        )}
        <span className="text-muted-foreground shrink-0">·</span>
        <span className="font-medium truncate">
          <span className="mr-1">{homeTeam.flag}</span>
          {homeTeam.code}
          {isLive && hasScore ? (
            <span className="font-black mx-1.5 tabular-nums">
              {result.homeGoals} - {result.awayGoals}
            </span>
          ) : (
            <span className="text-muted-foreground mx-1.5">x</span>
          )}
          {awayTeam.code}
          <span className="ml-1">{awayTeam.flag}</span>
        </span>
      </div>
    </div>
  )
}
