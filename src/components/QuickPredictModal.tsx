"use client"

import { useEffect, useRef, useState } from "react"
import { ModalDrawer } from "@/components/ModalDrawer"
import { ChevronUp, ChevronDown, Check, Lock, MapPin, Calendar, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Match, Prediction } from "@/lib/types"
import GaleraModal from "./GaleraModal"

const POINT_TYPE_STYLE: Record<string, string> = {
  exact: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  winner_plus_goals: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  winner: "bg-green-500/20 text-green-400 border-green-500/30",
  one_team_goals: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  zero: "bg-red-500/15 text-red-400 border-red-500/30",
}

const POINT_TYPE_LABEL: Record<string, string> = {
  exact: "Exato",
  winner_plus_goals: "Venc+Gols",
  winner: "Vencedor",
  one_team_goals: "1 Time",
  zero: "Errou",
}

interface Props {
  open: boolean
  onClose: () => void
  match: Match | null
  prediction: Prediction | undefined
  onSave: (matchId: string, homeGoals: number, awayGoals: number) => Promise<void>
}

export default function QuickPredictModal({ open, onClose, match, prediction, onSave }: Props) {
  const [homeGoals, setHomeGoals] = useState(prediction?.homeGoals ?? 0)
  const [awayGoals, setAwayGoals] = useState(prediction?.awayGoals ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showGalera, setShowGalera] = useState(false)
  const [bumping, setBumping] = useState<"home" | "away" | null>(null)

  // Keep the last non-null match so content stays visible during the exit animation
  const lastMatchRef = useRef<Match | null>(null)
  if (match) lastMatchRef.current = match
  const safeMatch = match ?? lastMatchRef.current!

  // Reset score inputs when the user opens a different match (replaces the key= remount)
  useEffect(() => {
    if (!match) return
    setHomeGoals(prediction?.homeGoals ?? 0)
    setAwayGoals(prediction?.awayGoals ?? 0)
    setSaved(false)
    setSaving(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id])

  // No match data yet (first render before any match is opened).
  // lastMatchRef ensures this never fires after the first real open.
  if (!safeMatch) return null

  const kickoff = new Date(safeMatch.scheduledAt).getTime()
  const locked = safeMatch.status !== "scheduled" || Date.now() >= kickoff - 5 * 60 * 1000
  const hasPrediction = prediction !== undefined
  const isDirty = homeGoals !== (prediction?.homeGoals ?? 0) || awayGoals !== (prediction?.awayGoals ?? 0)
  const isFinished = safeMatch.status === "finished"
  const hasResult = safeMatch.result.homeGoals !== null
  const isLive = safeMatch.status === "live"

  function bump(side: "home" | "away") {
    setBumping(side)
    setTimeout(() => setBumping(null), 280)
  }

  function changeHome(delta: number) {
    if (locked) return
    setHomeGoals((v) => Math.min(Math.max(v + delta, 0), 20))
    bump("home")
  }

  function changeAway(delta: number) {
    if (locked) return
    setAwayGoals((v) => Math.min(Math.max(v + delta, 0), 20))
    bump("away")
  }

  async function handleSave() {
    if (locked || saving) return
    setSaving(true)
    try {
      await onSave(safeMatch.id, homeGoals, awayGoals)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  }).format(new Date(safeMatch.scheduledAt))

  return (
    <>
      <ModalDrawer open={open} onOpenChange={(o) => !o && onClose()}>
          {/* Header */}
          <div className="bg-secondary/50 px-5 py-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                GRUPO {safeMatch.group} · J#{safeMatch.matchNumber}
              </span>
              {isLive && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  AO VIVO
                </span>
              )}
            </div>
            {safeMatch.stadium && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                <MapPin size={9} />
                <span>{safeMatch.stadium}</span>
              </div>
            )}
          </div>

          {/* Score area */}
          <div className="px-5 py-6">
            <div className="flex items-center justify-between gap-3">
              {/* Home team */}
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <span className="text-3xl leading-none">{safeMatch.homeTeam.flag}</span>
                <span className="text-[11px] font-black text-center leading-tight truncate w-full">
                  {safeMatch.homeTeam.name.toUpperCase()}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">{safeMatch.homeTeam.code}</span>
              </div>

              {/* Controls or result */}
              <div className="flex items-center gap-2 shrink-0">
                {isFinished && hasResult ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Resultado</p>
                    <div className="flex items-center gap-1">
                      <span className="text-4xl font-black tabular-nums leading-none w-10 text-center">
                        {safeMatch.result.homeGoals}
                      </span>
                      <span className="text-xl font-black text-border leading-none">×</span>
                      <span className="text-4xl font-black tabular-nums leading-none w-10 text-center">
                        {safeMatch.result.awayGoals}
                      </span>
                    </div>
                    {hasPrediction && (
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        Palpite: {prediction!.homeGoals}×{prediction!.awayGoals}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Home control */}
                    <div className="flex flex-col items-center gap-0.5">
                      {!locked && (
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeHome(1)}
                          className="w-8 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                          <ChevronUp size={16} strokeWidth={2.5} />
                        </motion.button>
                      )}
                      <motion.span
                        key={homeGoals}
                        initial={bumping === "home" ? { scale: 1.4, color: "#f97316" } : false}
                        animate={{ scale: 1, color: "#f5f5f5" }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="text-4xl font-black tabular-nums leading-none w-10 text-center"
                      >
                        {homeGoals}
                      </motion.span>
                      {!locked && (
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeHome(-1)}
                          className="w-8 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                          <ChevronDown size={16} strokeWidth={2.5} />
                        </motion.button>
                      )}
                    </div>

                    <span className="text-2xl font-black text-border leading-none">×</span>

                    {/* Away control */}
                    <div className="flex flex-col items-center gap-0.5">
                      {!locked && (
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeAway(1)}
                          className="w-8 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                          <ChevronUp size={16} strokeWidth={2.5} />
                        </motion.button>
                      )}
                      <motion.span
                        key={awayGoals + 100}
                        initial={bumping === "away" ? { scale: 1.4, color: "#f97316" } : false}
                        animate={{ scale: 1, color: "#f5f5f5" }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="text-4xl font-black tabular-nums leading-none w-10 text-center"
                      >
                        {awayGoals}
                      </motion.span>
                      {!locked && (
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeAway(-1)}
                          className="w-8 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                          <ChevronDown size={16} strokeWidth={2.5} />
                        </motion.button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Away team */}
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <span className="text-3xl leading-none">{safeMatch.awayTeam.flag}</span>
                <span className="text-[11px] font-black text-center leading-tight truncate w-full">
                  {safeMatch.awayTeam.name.toUpperCase()}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">{safeMatch.awayTeam.code}</span>
              </div>
            </div>

            {/* Points badge */}
            {isFinished && hasResult && prediction && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-4"
              >
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${POINT_TYPE_STYLE[prediction.pointBreakdown.type]}`}>
                  +{prediction.points}pts · {POINT_TYPE_LABEL[prediction.pointBreakdown.type]}
                </span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Calendar size={9} />
              <span>{dateStr}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGalera(true)}
                className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Users size={10} />
                <span>Galera</span>
              </button>

              {locked ? (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 rounded-full px-2 py-1 border border-border/50">
                  <Lock size={11} />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.button
                    key={saved ? "saved" : "save"}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleSave}
                    disabled={saving || (!isDirty && hasPrediction)}
                    className={`flex items-center gap-1 text-[10px] font-bold rounded-full px-3 py-1 transition-all duration-200 ${
                      saved
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : !isDirty && hasPrediction
                        ? "bg-secondary text-muted-foreground border border-border/50"
                        : "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
                    }`}
                  >
                    {saving ? "..." : saved ? <><Check size={10} className="mr-0.5" />Salvo</> : hasPrediction && !isDirty ? "Salvo" : "Salvar"}
                  </motion.button>
                </AnimatePresence>
              )}

              <button
                onClick={onClose}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
      </ModalDrawer>

      <GaleraModal
        open={showGalera}
        onClose={() => setShowGalera(false)}
        matchId={safeMatch.id}
        match={safeMatch}
      />
    </>
  )
}
