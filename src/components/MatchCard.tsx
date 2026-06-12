"use client"

import { useState, useRef } from "react"
import { MapPin, Calendar, Users, Lock, Check, ChevronUp, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Match, Prediction } from "@/lib/types"
import GaleraModal from "./GaleraModal"

interface Props {
  match: Match
  prediction: Prediction | undefined
  onSave: (matchId: string, homeGoals: number, awayGoals: number) => Promise<void>
  index?: number
}

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

export default function MatchCard({ match, prediction, onSave, index = 0 }: Props) {
  const [homeGoals, setHomeGoals] = useState(prediction?.homeGoals ?? 0)
  const [awayGoals, setAwayGoals] = useState(prediction?.awayGoals ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showGalera, setShowGalera] = useState(false)
  const [bumping, setBumping] = useState<"home" | "away" | null>(null)

  const kickoff = new Date(match.scheduledAt).getTime()
  const locked = match.status !== "scheduled" || Date.now() >= kickoff - 5 * 60 * 1000
  const hasPrediction = prediction !== undefined
  const isDirty = homeGoals !== (prediction?.homeGoals ?? 0) || awayGoals !== (prediction?.awayGoals ?? 0)
  const isFinished = match.status === "finished"
  const hasResult = match.result.homeGoals !== null

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
      await onSave(match.id, homeGoals, awayGoals)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(match.scheduledAt))

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
        className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
          locked
            ? "bg-secondary/30 border-border/40 opacity-70"
            : hasPrediction
            ? "bg-card border-primary/25 shadow-lg shadow-primary/5"
            : "bg-card border-border hover:border-border/80"
        }`}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground">JOGO #{match.matchNumber}</span>
            <span className="text-[10px] text-border">•</span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              GRUPO {match.group}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin size={9} />
            <span className="truncate max-w-[130px]">{match.stadium}</span>
          </div>
        </div>

        {/* Teams and score */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between gap-1">
            {/* Home team */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span className="text-2xl sm:text-3xl leading-none">{match.homeTeam.flag}</span>
              <span className="text-[11px] font-black text-center leading-tight truncate w-full text-center">
                {match.homeTeam.name.toUpperCase()}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">{match.homeTeam.code}</span>
            </div>

            {/* Score controls / Final score */}
            <div className="flex items-center gap-2 shrink-0">
              {isFinished && hasResult ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Resultado</span>
                  <div className="flex items-center gap-1">
                    <span className="text-3xl sm:text-4xl font-black tabular-nums leading-none w-10 text-center">
                      {match.result.homeGoals}
                    </span>
                    <span className="text-xl font-black text-border leading-none">×</span>
                    <span className="text-3xl sm:text-4xl font-black tabular-nums leading-none w-10 text-center">
                      {match.result.awayGoals}
                    </span>
                  </div>
                  {hasPrediction && (
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      Palpite: {prediction!.homeGoals}×{prediction!.awayGoals}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  {/* Home score */}
                  <div className="flex flex-col items-center gap-0.5">
                    {!locked && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => changeHome(1)}
                        className="w-7 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <ChevronUp size={14} strokeWidth={2.5} />
                      </motion.button>
                    )}
                    <motion.span
                      key={homeGoals}
                      initial={bumping === "home" ? { scale: 1.4, color: "#f97316" } : false}
                      animate={{ scale: 1, color: "#f5f5f5" }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="text-3xl sm:text-4xl font-black tabular-nums leading-none w-10 text-center"
                    >
                      {homeGoals}
                    </motion.span>
                    {!locked && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => changeHome(-1)}
                        className="w-7 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <ChevronDown size={14} strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </div>

                  <span className="text-xl font-black text-border leading-none">×</span>

                  {/* Away score */}
                  <div className="flex flex-col items-center gap-0.5">
                    {!locked && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => changeAway(1)}
                        className="w-7 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <ChevronUp size={14} strokeWidth={2.5} />
                      </motion.button>
                    )}
                    <motion.span
                      key={awayGoals + 100}
                      initial={bumping === "away" ? { scale: 1.4, color: "#f97316" } : false}
                      animate={{ scale: 1, color: "#f5f5f5" }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="text-3xl sm:text-4xl font-black tabular-nums leading-none w-10 text-center"
                    >
                      {awayGoals}
                    </motion.span>
                    {!locked && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => changeAway(-1)}
                        className="w-7 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <ChevronDown size={14} strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span className="text-2xl sm:text-3xl leading-none">{match.awayTeam.flag}</span>
              <span className="text-[11px] font-black text-center leading-tight truncate w-full text-center">
                {match.awayTeam.name.toUpperCase()}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">{match.awayTeam.code}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 pb-3 border-t border-border/30 pt-2 gap-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar size={9} />
            <span>{dateStr}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGalera(true)}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Users size={10} />
              <span>Palpites da Galera</span>
            </button>

            {locked ? (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5 border border-border/50">
                <Lock size={12} />
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
          </div>
        </div>

        {/* Points badge for finished matches */}
        {isFinished && hasResult && prediction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-3 pb-3 flex justify-end"
          >
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${POINT_TYPE_STYLE[prediction.pointBreakdown.type]}`}>
              +{prediction.points}pts · {POINT_TYPE_LABEL[prediction.pointBreakdown.type]}
            </span>
          </motion.div>
        )}
      </motion.div>

      <GaleraModal
        open={showGalera}
        onClose={() => setShowGalera(false)}
        matchId={match.id}
        match={match}
      />
    </>
  )
}
