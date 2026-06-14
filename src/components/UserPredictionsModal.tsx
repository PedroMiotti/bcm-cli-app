"use client"

import { useEffect, useRef, useState } from "react"
import { ModalDrawer } from "@/components/ModalDrawer"
import { Lock } from "lucide-react"
import { motion } from "framer-motion"
import type { RankingEntry } from "@/lib/types"

interface PredictionItem {
  match: {
    id: string
    group: string
    matchNumber: number
    homeTeam: { name: string; code: string; flag: string }
    awayTeam: { name: string; code: string; flag: string }
    scheduledAt: string
    status: "scheduled" | "live" | "finished"
    result: { homeGoals: number | null; awayGoals: number | null }
  }
  prediction: {
    homeGoals: number
    awayGoals: number
    points: number
    pointType: string
  } | null
  locked: boolean
  hasPrediction: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  entry: RankingEntry | null
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const TYPE_STYLE: Record<string, string> = {
  exact: "text-orange-400 bg-orange-500/15 border-orange-500/25",
  winner_plus_goals: "text-yellow-400 bg-yellow-500/15 border-yellow-500/25",
  winner: "text-green-400 bg-green-500/15 border-green-500/25",
  one_team_goals: "text-blue-400 bg-blue-500/15 border-blue-500/25",
  zero: "text-muted-foreground bg-secondary border-border/40",
}

const TYPE_LABEL: Record<string, string> = {
  exact: "18",
  winner_plus_goals: "12",
  winner: "9",
  one_team_goals: "3",
  zero: "0",
}

const TYPE_NAME: Record<string, string> = {
  exact: "Placar Exato",
  winner_plus_goals: "Vencedor + Gols",
  winner: "Vencedor",
  one_team_goals: "1 Placar",
  zero: "Errou",
}

export default function UserPredictionsModal({ open, onClose, entry }: Props) {
  const [items, setItems] = useState<PredictionItem[]>([])
  const [loading, setLoading] = useState(false)

  // Keep the last non-null entry so the content stays visible during the exit animation
  const lastEntryRef = useRef<RankingEntry | null>(null)
  if (entry) lastEntryRef.current = entry
  const safeEntry = entry ?? lastEntryRef.current

  useEffect(() => {
    if (!open || !safeEntry) return
    setLoading(true)
    fetch(`/api/users/${safeEntry.userId}/predictions`)
      .then((r) => r.json())
      .then((data) => setItems(data))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, safeEntry?.userId])

  const finished = items.filter((i) => i.match.status === "finished")
  const other = items.filter((i) => i.match.status !== "finished")

  return (
    <ModalDrawer open={open} onOpenChange={(o) => !o && onClose()}>
        {/* Header */}
        <div className="bg-secondary/50 px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-base font-black text-primary">
              {safeEntry ? getInitials(safeEntry.displayName) : ""}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate">{safeEntry?.displayName}</p>
              <p className="text-[11px] text-muted-foreground">@{safeEntry?.username}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-primary tabular-nums">{safeEntry?.totalPoints}</p>
              <p className="text-[10px] text-muted-foreground">pts · {safeEntry?.position}º lugar</p>
            </div>
          </div>

          {/* Breakdown chips */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {[
              { key: "exact", label: "18", count: safeEntry?.breakdown.exact ?? 0, color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
              { key: "winnerPlusGoals", label: "12", count: safeEntry?.breakdown.winnerPlusGoals ?? 0, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
              { key: "winner", label: "9", count: safeEntry?.breakdown.winner ?? 0, color: "text-green-400 bg-green-400/10 border-green-400/20" },
              { key: "oneTeamGoals", label: "3", count: safeEntry?.breakdown.oneTeamGoals ?? 0, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
            ].map(({ key, label, count, color }) => (
              <div key={key} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ${color}`}>
                <span>{count}×</span>
                <span>+{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum palpite registrado ainda
            </div>
          ) : (
            <div className="space-y-2">
              {finished.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Jogos Finalizados ({finished.length})
                  </p>
                  {finished.map((item, i) => (
                    <PredictionRow key={item.match.id} item={item} index={i} />
                  ))}
                </>
              )}

              {other.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4 mb-2">
                    Próximos Jogos ({other.length})
                  </p>
                  {other.map((item, i) => (
                    <PredictionRow key={item.match.id} item={item} index={finished.length + i} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/40 p-4">
          <button
            onClick={onClose}
            className="w-full bg-secondary hover:bg-border text-sm font-bold rounded-xl py-2.5 transition-colors"
          >
            FECHAR
          </button>
        </div>
    </ModalDrawer>
  )
}

function PredictionRow({ item, index }: { item: PredictionItem; index: number }) {
  const { match, prediction, locked } = item
  const isFinished = match.status === "finished"
  const hasResult = isFinished && match.result.homeGoals !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-secondary/60 rounded-xl border border-border/30 px-3 py-2.5"
    >
      {/* Match label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          Grupo {match.group} · J{match.matchNumber}
        </span>
        <span className="text-[9px] text-muted-foreground">
          {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
            new Date(match.scheduledAt)
          )}
        </span>
      </div>

      {/* Teams row */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-lg">{match.homeTeam.flag}</span>
          <span className="text-xs font-bold truncate">{match.homeTeam.code}</span>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Prediction */}
          {locked ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock size={11} />
              <span className="text-[11px]">Bloqueado</span>
            </div>
          ) : prediction ? (
            <>
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground mb-0.5">palpite</p>
                <span className="text-base font-black tabular-nums">
                  {prediction.homeGoals} × {prediction.awayGoals}
                </span>
              </div>

              {hasResult && (
                <>
                  <span className="text-muted-foreground/40 text-xs">|</span>
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground mb-0.5">placar</p>
                    <span className="text-base font-black tabular-nums text-primary">
                      {match.result.homeGoals} × {match.result.awayGoals}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold truncate">{match.awayTeam.code}</span>
          <span className="text-lg">{match.awayTeam.flag}</span>
        </div>
      </div>

      {/* Points badge */}
      {prediction && isFinished && (
        <div className="flex justify-center mt-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
              TYPE_STYLE[prediction.pointType]
            }`}
          >
            {prediction.points > 0 ? `+${TYPE_LABEL[prediction.pointType]} pts` : "0 pts"} · {TYPE_NAME[prediction.pointType]}
          </span>
        </div>
      )}
    </motion.div>
  )
}
