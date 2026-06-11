"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuthStore } from "@/store/auth"
import type { Match, Prediction } from "@/lib/types"
import GroupFilter from "@/components/GroupFilter"
import MatchCard from "@/components/MatchCard"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ChevronRight } from "lucide-react"

export default function JogosPage() {
  const user = useAuthStore((s) => s.user)
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedGroup, setSelectedGroup] = useState("A")
  const [loading, setLoading] = useState(true)

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
