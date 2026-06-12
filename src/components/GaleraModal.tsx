"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Lock, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Match } from "@/lib/types"

interface Palpite {
  displayName: string
  homeGoals: number
  awayGoals: number
  points: number
  pointType: string
}

interface Props {
  open: boolean
  onClose: () => void
  matchId: string
  match: Match
}

const TYPE_STYLE: Record<string, string> = {
  exact:            "text-orange-400 bg-orange-500/15 border-orange-500/25",
  winner_plus_goals:"text-yellow-400 bg-yellow-500/15 border-yellow-500/25",
  winner:           "text-green-400 bg-green-500/15 border-green-500/25",
  one_team_goals:   "text-blue-400 bg-blue-500/15 border-blue-500/25",
  zero:             "text-muted-foreground bg-secondary border-border/40",
}

const TYPE_LABEL: Record<string, string> = {
  exact: "18", winner_plus_goals: "12", winner: "9", one_team_goals: "3", zero: "0",
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function GaleraModal({ open, onClose, matchId, match }: Props) {
  const [locked, setLocked] = useState(true)
  const [palpites, setPalpites] = useState<Palpite[]>([])
  const [hasPrediction, setHasPrediction] = useState<string[]>([])
  const [noPrediction, setNoPrediction] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const isFinished = match.status === "finished"

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/predictions/galera?matchId=${matchId}`)
      .then((r) => r.json())
      .then((data) => {
        setLocked(data.locked)
        setHasPrediction(data.hasPrediction ?? [])
        setNoPrediction(data.noPrediction ?? [])
        const predictions: Palpite[] = data.predictions ?? []
        if (isFinished) predictions.sort((a, b) => b.points - a.points)
        setPalpites(predictions)
      })
      .finally(() => setLoading(false))
  }, [open, matchId, isFinished])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm bg-card border-border/60 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-secondary/50 px-5 py-4 border-b border-border/40">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
            GRUPO {match.group} · PALPITES DA GALERA
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{match.homeTeam.flag}</span>
            <div className="flex-1 text-center">
              <p className="text-sm font-black">
                {match.homeTeam.name} × {match.awayTeam.name}
              </p>
              {match.status === "finished" && match.result.homeGoals !== null && (
                <p className="text-xs text-primary font-bold mt-0.5">
                  {match.result.homeGoals} × {match.result.awayGoals}
                </p>
              )}
            </div>
            <span className="text-2xl">{match.awayTeam.flag}</span>
          </div>
          {match.stadium && (
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-2">
              <MapPin size={9} />
              <span>{match.stadium}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : locked ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock size={12} />
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Palpites revelados no apito inicial
                </p>
              </div>

              {hasPrediction.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-wide mb-2">
                    Já palpitaram ({hasPrediction.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {hasPrediction.map((name) => (
                      <div key={name} className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-[9px] font-bold text-green-400">
                          {getInitials(name)}
                        </div>
                        <span className="text-[11px] font-medium">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {noPrediction.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Aguardando ({noPrediction.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {noPrediction.map((name) => (
                      <div key={name} className="flex items-center gap-1.5 bg-secondary/60 border border-border/30 rounded-lg px-2 py-1">
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                          {getInitials(name)}
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-1 w-full bg-secondary hover:bg-border text-sm font-bold rounded-xl py-2.5 transition-colors"
              >
                FECHAR
              </button>
            </motion.div>
          ) : palpites.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum palpite registrado ainda
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                PALPITES DE TODOS ({palpites.length})
              </p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-hide">
                {palpites.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between bg-secondary/60 rounded-xl px-3 py-2 border border-border/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {getInitials(p.displayName)}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[120px]">{p.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black tabular-nums">
                        {p.homeGoals} × {p.awayGoals}
                      </span>
                      {p.points > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${TYPE_STYLE[p.pointType]}`}>
                          +{TYPE_LABEL[p.pointType]}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-secondary hover:bg-border text-sm font-bold rounded-xl py-2.5 transition-colors"
              >
                FECHAR
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
