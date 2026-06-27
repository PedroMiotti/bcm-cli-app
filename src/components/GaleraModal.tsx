"use client"

import { useEffect, useMemo, useState } from "react"
import { Lock, MapPin, ChevronDown, ChevronUp, Zap } from "lucide-react"
import { ModalDrawer } from "@/components/ModalDrawer"
import { motion, AnimatePresence } from "framer-motion"
import type { Match } from "@/lib/types"
import { PHASE_LABELS } from "@/lib/types"
import { calculatePoints } from "@/lib/scoring"

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
  const [showSimulator, setShowSimulator] = useState(false)
  const [simHome, setSimHome] = useState(match.result.homeGoals ?? 0)
  const [simAway, setSimAway] = useState(match.result.awayGoals ?? 0)
  const [simBumping, setSimBumping] = useState<"home" | "away" | null>(null)

  const isFinished = match.status === "finished"

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setShowSimulator(false)
    setSimHome(match.result.homeGoals ?? 0)
    setSimAway(match.result.awayGoals ?? 0)
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

  function simBump(side: "home" | "away") {
    setSimBumping(side)
    setTimeout(() => setSimBumping(null), 280)
  }

  const simResults = useMemo(
    () =>
      [...palpites]
        .map((p) => {
          const bd = calculatePoints(p.homeGoals, p.awayGoals, simHome, simAway)
          return { ...p, simPoints: bd.value, simType: bd.type }
        })
        .sort((a, b) => b.simPoints - a.simPoints),
    [palpites, simHome, simAway]
  )

  return (
    <ModalDrawer open={open} onOpenChange={(o) => !o && onClose()}>
        {/* Header */}
        <div className="bg-secondary/50 px-5 py-4 border-b border-border/40 shrink-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
            {match.phase === "grupo" ? `GRUPO ${match.group}` : PHASE_LABELS[match.phase].toUpperCase()} · PALPITES DA GALERA
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
        <div className="flex-1 overflow-y-auto p-5">
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
              <div className="space-y-1.5">
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

              {/* Simulator */}
              <div className="mt-3">
                <button
                  onClick={() => setShowSimulator((v) => !v)}
                  className="w-full flex items-center justify-between py-2.5 border-t border-border/30 group"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
                    <Zap size={10} className="text-primary/70" />
                    Simular placar
                  </div>
                  <motion.div
                    animate={{ rotate: showSimulator ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={12} className="text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showSimulator && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {/* Score input */}
                      <div className="flex items-center justify-center gap-6 py-3 bg-secondary/40 rounded-xl mb-3 mt-1">
                        {/* Home */}
                        <div className="flex items-center gap-2">
                          <span className="text-xl leading-none">{match.homeTeam.flag}</span>
                          <div className="flex flex-col items-center gap-0.5">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => { setSimHome((v) => Math.min(v + 1, 20)); simBump("home") }}
                              className="w-7 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <ChevronUp size={14} strokeWidth={2.5} />
                            </motion.button>
                            <motion.span
                              key={simHome}
                              initial={simBumping === "home" ? { scale: 1.4, color: "#f97316" } : false}
                              animate={{ scale: 1, color: "#f5f5f5" }}
                              transition={{ duration: 0.22, ease: "easeOut" }}
                              className="text-2xl font-black tabular-nums leading-none w-8 text-center"
                            >
                              {simHome}
                            </motion.span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => { setSimHome((v) => Math.max(v - 1, 0)); simBump("home") }}
                              className="w-7 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <ChevronDown size={14} strokeWidth={2.5} />
                            </motion.button>
                          </div>
                        </div>

                        <span className="text-lg font-black text-border leading-none">×</span>

                        {/* Away */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center gap-0.5">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => { setSimAway((v) => Math.min(v + 1, 20)); simBump("away") }}
                              className="w-7 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <ChevronUp size={14} strokeWidth={2.5} />
                            </motion.button>
                            <motion.span
                              key={simAway + 100}
                              initial={simBumping === "away" ? { scale: 1.4, color: "#f97316" } : false}
                              animate={{ scale: 1, color: "#f5f5f5" }}
                              transition={{ duration: 0.22, ease: "easeOut" }}
                              className="text-2xl font-black tabular-nums leading-none w-8 text-center"
                            >
                              {simAway}
                            </motion.span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => { setSimAway((v) => Math.max(v - 1, 0)); simBump("away") }}
                              className="w-7 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <ChevronDown size={14} strokeWidth={2.5} />
                            </motion.button>
                          </div>
                          <span className="text-xl leading-none">{match.awayTeam.flag}</span>
                        </div>
                      </div>

                      {/* Simulated ranking */}
                      <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">
                        Pontuação simulada
                      </p>
                      <div className="space-y-1.5">
                        {simResults.map((p, i) => (
                          <div
                            key={p.displayName}
                            className="flex items-center justify-between bg-secondary/60 rounded-xl px-3 py-2 border border-border/30"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground tabular-nums w-4">{i + 1}º</span>
                              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {getInitials(p.displayName)}
                              </div>
                              <span className="text-sm font-medium truncate max-w-[100px]">{p.displayName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black tabular-nums">
                                {p.homeGoals} × {p.awayGoals}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border min-w-[26px] text-center ${TYPE_STYLE[p.simType]}`}>
                                +{TYPE_LABEL[p.simType]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
    </ModalDrawer>
  )
}
