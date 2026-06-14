"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuthStore } from "@/store/auth"
import type { Match, Prediction } from "@/lib/types"
import GroupFilter from "@/components/GroupFilter"
import MatchCard from "@/components/MatchCard"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ChevronDown, ChevronRight, Pencil } from "lucide-react"
import QuickPredictModal from "@/components/QuickPredictModal"

const MINI_PT_STYLE: Record<string, string> = {
  exact: "text-orange-400 bg-orange-500/15 border-orange-500/25",
  winner_plus_goals: "text-yellow-400 bg-yellow-500/15 border-yellow-500/25",
  winner: "text-green-400 bg-green-500/15 border-green-500/25",
  one_team_goals: "text-blue-400 bg-blue-500/15 border-blue-500/25",
  zero: "text-muted-foreground bg-secondary border-border/40",
}

export default function JogosPage() {
  const user = useAuthStore((s) => s.user)
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedGroup, setSelectedGroup] = useState("A")
  const [loading, setLoading] = useState(true)
  const [showDaySection, setShowDaySection] = useState(true)
  const [openMatch, setOpenMatch] = useState<Match | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetch("/api/matches").then((r) => r.json()),
      fetch(`/api/predictions?userId=${user.id}`).then((r) => r.json()),
    ])
      .then(([m, p]) => {
        setMatches(m)
        setPredictions(p)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const predMap = useMemo(
    () => Object.fromEntries(predictions.map((p) => [p.matchId, p])),
    [predictions]
  )

  const groupProgress = useMemo(() => {
    const result: Record<string, { done: number; total: number }> = {}
    for (const m of matches) {
      if (!result[m.group]) result[m.group] = { done: 0, total: 0 }
      result[m.group].total++
      if (predMap[m.id]) result[m.group].done++
    }
    return result
  }, [matches, predMap])

  const totalPalpitados = predictions.length
  const totalMatches = matches.length
  const pct = totalMatches > 0 ? Math.round((totalPalpitados / totalMatches) * 100) : 0
  const allDone = totalPalpitados === totalMatches && totalMatches > 0

  const { todayMatches, tomorrowMatches } = useMemo(() => {
    const fmt = (d: Date) =>
      new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        year: "numeric", month: "2-digit", day: "2-digit",
      }).format(d)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const todayStr = fmt(now)
    const tomorrowStr = fmt(tomorrow)
    const sorted = [...matches].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    return {
      todayMatches: sorted.filter((m) => fmt(new Date(m.scheduledAt)) === todayStr),
      tomorrowMatches: sorted.filter((m) => fmt(new Date(m.scheduledAt)) === tomorrowStr),
    }
  }, [matches])

  const groupMatches = useMemo(
    () => matches.filter((m) => m.group === selectedGroup).sort((a, b) => a.matchNumber - b.matchNumber),
    [matches, selectedGroup]
  )

  async function handleSave(matchId: string, homeGoals: number, awayGoals: number) {
    if (!user) return
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, matchId, homeGoals, awayGoals }),
    })
    if (!res.ok) return
    const saved: Prediction = await res.json()
    setPredictions((prev) => {
      const idx = prev.findIndex((p) => p.matchId === matchId)
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n }
      return [...prev, saved]
    })
  }

  if (loading) {
    return (
      <div className="p-4 pt-5 space-y-3">
        <div className="h-20 rounded-2xl bg-secondary/60 animate-pulse" />
        <div className="h-10 rounded-xl bg-secondary/60 animate-pulse" />
        <div className="h-10 rounded-xl bg-secondary/40 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-secondary/40 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-2">
      {/* Today and tomorrow games */}
      {(todayMatches.length > 0 || tomorrowMatches.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="mt-4 px-4"
        >
          <button
            onClick={() => setShowDaySection((v) => !v)}
            className="flex items-center justify-between w-full mb-2 group"
          >
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">
              Jogos do Dia
            </p>
            <motion.div
              animate={{ rotate: showDaySection ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {showDaySection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 pb-1">
          {(["today", "tomorrow"] as const).map((day) => {
            const dayMatches = day === "today" ? todayMatches : tomorrowMatches
            const label = day === "today" ? "Hoje" : "Amanhã"
            return (
              <div key={day} className="min-w-0">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
                {dayMatches.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50 italic">Sem jogos.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dayMatches.map((match) => {
                      const pred = predMap[match.id]
                      const timeStr = new Intl.DateTimeFormat("pt-BR", {
                        hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
                      }).format(new Date(match.scheduledAt))
                      const isLive = match.status === "live"
                      const isFinished = match.status === "finished"
                      const hasScore = match.result.homeGoals !== null
                      const isLocked = match.status !== "scheduled" || Date.now() >= new Date(match.scheduledAt).getTime() - 5 * 60 * 1000

                      return (
                        <button
                          key={match.id}
                          onClick={() => setOpenMatch(match)}
                          className={`rounded-xl border px-2.5 py-2 flex flex-col gap-1.5 transition-all text-left w-full active:scale-[0.98] ${
                            isLive
                              ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
                              : isFinished
                              ? "bg-secondary/40 border-border/40 hover:bg-secondary/60"
                              : pred
                              ? "bg-card border-primary/20 hover:border-primary/35"
                              : "bg-card border-border/60 hover:border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            {isLive ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Ao Vivo
                              </span>
                            ) : (
                              <span className="text-[9px] text-muted-foreground font-semibold">{timeStr}</span>
                            )}
                            <span className="text-[9px] text-muted-foreground font-medium">Grupo {match.group}</span>
                          </div>

                          <div className="flex items-center justify-between gap-1 w-full">
                            <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                              <span className="text-lg leading-none">{match.homeTeam.flag}</span>
                              <span className="text-[9px] font-black truncate">{match.homeTeam.code}</span>
                            </div>

                            <div className="shrink-0 text-center">
                              {(isLive || isFinished) && hasScore ? (
                                <span className={`text-xs font-black tabular-nums ${isLive ? "text-primary" : ""}`}>
                                  {match.result.homeGoals}–{match.result.awayGoals}
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-muted-foreground">×</span>
                              )}
                            </div>

                            <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                              <span className="text-lg leading-none">{match.awayTeam.flag}</span>
                              <span className="text-[9px] font-black truncate">{match.awayTeam.code}</span>
                            </div>
                          </div>

                          {/* Prediction / CTA row — fixed height so all cards stay the same size */}
                          <div className={`border-t border-border/20 h-6 flex items-center px-0.5 w-full ${isFinished && pred ? "justify-between" : "justify-center"}`}>
                            {isFinished && pred ? (
                              <>
                                <span className="text-[9px] font-medium text-muted-foreground tabular-nums">
                                  {pred.homeGoals}–{pred.awayGoals}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${MINI_PT_STYLE[pred.pointBreakdown.type]}`}>
                                  +{pred.points}pts
                                </span>
                              </>
                            ) : pred ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-muted-foreground border-border/50 bg-secondary/60 tabular-nums">
                                {pred.homeGoals}–{pred.awayGoals}
                              </span>
                            ) : !isLocked ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border text-primary/70 border-primary/25 bg-primary/8">
                                <Pencil size={7} strokeWidth={2.5} />
                                Palpitar
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full border text-muted-foreground/40 border-border/25">
                                Sem palpite
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Done banner */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-4 mt-4 rounded-2xl bg-primary/10 border border-primary/25 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-primary shrink-0" />
              <p className="text-sm font-bold text-primary">
                Todos os {totalMatches} palpites feitos! 🎉
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mx-4 mt-4 rounded-2xl bg-card border border-border/60 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">
              ⚽ Meus Palpites da Fase de Grupos
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Dê seus palpites para os confrontos oficiais.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-semibold">PALPITADOS</p>
            <p className="text-sm font-black tabular-nums">
              <span className="text-primary">{totalPalpitados}</span>
              <span className="text-muted-foreground"> / {totalMatches}</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="h-full bg-primary rounded-full"
            style={{ boxShadow: "0 0 8px rgb(249 115 22 / 0.5)" }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">{pct}% concluído</span>
          {pct < 100 && (
            <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
              Completar <ChevronRight size={10} />
            </span>
          )}
        </div>
      </motion.div>

      {/* Group filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-4 mb-1"
      >
        <GroupFilter selected={selectedGroup} onSelect={setSelectedGroup} progress={groupProgress} />
      </motion.div>

      {/* Group label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedGroup}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ duration: 0.2 }}
          className="px-4 mt-4 mb-3"
        >
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-black">GRUPO {selectedGroup}</h2>
            <span className="text-xs text-muted-foreground">
              {groupProgress[selectedGroup]?.done ?? 0}/{groupProgress[selectedGroup]?.total ?? 6} palpites
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick predict modal for day cards */}
      <QuickPredictModal
        open={!!openMatch}
        onClose={() => setOpenMatch(null)}
        match={openMatch}
        prediction={openMatch ? predMap[openMatch.id] : undefined}
        onSave={handleSave}
      />

      {/* Match cards — 2-col grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedGroup}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4"
        >
          {groupMatches.map((match, i) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predMap[match.id]}
              onSave={handleSave}
              index={i}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
