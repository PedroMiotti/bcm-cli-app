"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth"
import type { RankingEntry } from "@/lib/types"
import { motion } from "framer-motion"
import { RefreshCw, Cloud } from "lucide-react"

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

const MEDAL_COLORS = [
  "from-yellow-400/30 to-yellow-600/10 border-yellow-400/40 text-yellow-400",
  "from-slate-300/20 to-slate-500/10 border-slate-400/30 text-slate-300",
  "from-amber-600/25 to-amber-800/10 border-amber-600/30 text-amber-500",
]

const MEDAL_ICONS = ["🥇", "🥈", "🥉"]

const CAT_COLS = [
  { key: "exact", label: "18", title: "Placar Exato", color: "text-orange-400 bg-orange-400/15 border-orange-400/30" },
  { key: "winnerPlusGoals", label: "12", title: "Vencedor + Gols", color: "text-red-400   bg-red-400/15    border-red-400/30" },
  { key: "winner", label: "9", title: "Vencedor Apenas", color: "text-green-400 bg-green-400/15  border-green-400/30" },
  { key: "oneTeamGoals", label: "3", title: "1 Placar", color: "text-teal-400  bg-teal-400/15   border-teal-400/30" },
]

export default function RankingPage() {
  const user = useAuthStore((s) => s.user)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function loadRanking(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      const data = await fetch("/api/ranking").then((r) => r.json())
      setRanking(data)
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadRanking() }, [])

  const top3 = ranking.slice(0, 3)
  const timeStr = lastUpdate
    ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(lastUpdate)
    : "—"

  if (loading) {
    return (
      <div className="p-4 pt-5 space-y-3">
        <div className="h-10 rounded-xl bg-secondary/60 animate-pulse" />
        <div className="h-40 rounded-2xl bg-secondary/50 animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-secondary/40 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      {/* Auto-update notice */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-4 py-3"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Cloud size={13} />
          <span>Placares atualizam automaticamente todo dia</span>
        </div>
        <button
          onClick={() => loadRanking(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold bg-primary/15 text-primary hover:bg-primary/25 rounded-full px-3 py-1.5 transition-all"
        >
          <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
          Atualizar agora
        </button>
      </motion.div>

      {/* Podium */}
      {top3.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card border border-border/60 p-5"
        >
          <div className="flex items-end justify-center gap-4">
            {/* Reorder: 2nd, 1st, 3rd */}
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, i) => {
              const realIdx = i === 0 ? 1 : i === 1 ? 0 : 2
              const isFirst = realIdx === 0
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + realIdx * 0.05 }}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <span className="text-2xl">{MEDAL_ICONS[realIdx]}</span>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-b border flex items-center justify-center text-lg font-black ${MEDAL_COLORS[realIdx]} ${isFirst ? "w-16 h-16" : ""}`}>
                    {getInitials(entry.displayName)}
                  </div>
                  <div className={`w-full rounded-xl border bg-gradient-to-b px-2 py-2 text-center ${MEDAL_COLORS[realIdx]} ${isFirst ? "h-28" : "h-20"} flex flex-col justify-center`}>
                    <p className="text-[11px] font-bold truncate">{entry.displayName.split(" ")[0]}</p>
                    <p className={`font-black tabular-nums ${isFirst ? "text-2xl" : "text-xl"} mt-0.5`}>
                      {entry.totalPoints}
                    </p>
                    <p className="text-[9px] opacity-60">pts</p>
                    {isFirst && (
                      <span className="text-[9px] font-bold bg-yellow-400/20 text-yellow-400 rounded-full px-2 py-0.5 mt-1">
                        LÍDER
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Ranking table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl bg-card border border-border/60 overflow-hidden"
      >
        {/* Column headers */}
        <div className="grid grid-cols-[2.5rem_1fr_repeat(4,2rem)_3rem] gap-1 items-center px-3 py-2 border-b border-border/40 bg-secondary/30">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">POS</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase">PARTICIPANTE</span>
          {CAT_COLS.map((c) => (
            <div key={c.key} className="flex justify-center" title={c.title}>
              <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border ${c.color}`}>
                {c.label}
              </span>
            </div>
          ))}
          <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">PONTOS</span>
        </div>

        {/* Rows */}
        {ranking.map((entry, idx) => {
          const isMe = entry.userId === user?.id
          const medalIcon = entry.position <= 3 ? MEDAL_ICONS[entry.position - 1] : null

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + idx * 0.03, duration: 0.25 }}
              className={`grid grid-cols-[2.5rem_1fr_repeat(4,2rem)_3rem] gap-1 items-center px-3 py-2.5 border-b border-border/20 last:border-0 transition-colors ${isMe ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-secondary/20"
                }`}
            >
              <div className="flex items-center gap-1">
                {medalIcon ? (
                  <span className="text-sm">{medalIcon}</span>
                ) : (
                  <span className="text-xs text-muted-foreground font-bold">{entry.position}º</span>
                )}
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black ${isMe ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground border border-border/40"
                  }`}>
                  {getInitials(entry.displayName)}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                    {entry.displayName}
                  </p>
                  <p className="text-[10px] text-primary/60">{isMe ? `você - @${entry.username}` : `@${entry.username}`}</p>
                </div>
              </div>

              {(["exact", "winnerPlusGoals", "winner", "oneTeamGoals"] as const).map((key) => (
                <span key={key} className="text-xs text-center tabular-nums text-muted-foreground">
                  {entry.breakdown[key]}
                </span>
              ))}

              <span className={`text-sm font-black text-right tabular-nums ${entry.totalPoints > 0 ? "text-primary" : "text-muted-foreground"
                }`}>
                {entry.totalPoints}
              </span>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Footer stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-4 rounded-2xl bg-card border border-border/60 overflow-hidden"
      >
        {CAT_COLS.map(({ label, title, color }, i) => {
          const key = (["exact", "winnerPlusGoals", "winner", "oneTeamGoals"] as const)[i]
          const total = ranking.reduce((a, r) => a + r.breakdown[key], 0)
          return (
            <div key={label} className={`flex flex-col items-center py-3 px-2 border-r border-border/30 last:border-0`}>
              <span className={`text-xl font-black ${color.split(" ")[0]}`}>{total}</span>
              <span className="text-[9px] text-muted-foreground text-center leading-tight mt-0.5">
                {title.split(" ").slice(0, 2).join("\n")}
              </span>
            </div>
          )
        })}
      </motion.div>

      {/* Last update + count */}
      <p className="text-[10px] text-center text-muted-foreground pb-2">
        Exibindo {ranking.length} participantes · Última atualização: {timeStr}
      </p>
    </div>
  )
}
