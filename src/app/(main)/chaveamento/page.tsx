"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { Match } from "@/lib/types"

// ── layout constants ──────────────────────────────────────────────────────────
const SH = 112      // slot height per oitavas match (px)
const BH = SH * 4   // total bracket height = 448px
const CW = 136      // match card width (px)
const XW = 24       // connector column width (px)
const BORDER = "hsl(var(--border) / 0.45)"
const BR = 6

// ── compact match card ────────────────────────────────────────────────────────
function BracketCard({ match }: { match: Match | null }) {
  if (!match) {
    return (
      <div
        style={{ width: CW }}
        className="h-[76px] rounded-xl border border-dashed border-border/30 bg-secondary/20 flex items-center justify-center"
      >
        <span className="text-[10px] text-muted-foreground/35 font-medium">A definir</span>
      </div>
    )
  }

  const isFinished = match.status === "finished"
  const isLive = match.status === "live"
  const hasResult = match.result.homeGoals !== null
  const homeWon = isFinished && hasResult && match.result.homeGoals! > match.result.awayGoals!
  const awayWon = isFinished && hasResult && match.result.awayGoals! > match.result.homeGoals!

  const score = (goals: number | null) =>
    isLive && goals !== null ? goals : isFinished && goals !== null ? goals : "–"

  return (
    <div
      style={{ width: CW }}
      className={`rounded-xl border px-2.5 py-2 ${
        isLive
          ? "bg-primary/8 border-primary/25"
          : isFinished
          ? "bg-card border-border/60"
          : "bg-secondary/40 border-border/40"
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-base leading-none">{match.homeTeam.flag}</span>
          <span className={`text-[11px] font-black truncate leading-none ${homeWon ? "text-foreground" : "text-foreground/70"}`}>
            {match.homeTeam.code}
          </span>
        </div>
        <span className={`text-[13px] font-black tabular-nums leading-none ${homeWon ? "text-foreground" : isFinished || isLive ? "text-muted-foreground/60" : "text-muted-foreground/30"}`}>
          {score(match.result.homeGoals)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-base leading-none">{match.awayTeam.flag}</span>
          <span className={`text-[11px] font-black truncate leading-none ${awayWon ? "text-foreground" : "text-foreground/70"}`}>
            {match.awayTeam.code}
          </span>
        </div>
        <span className={`text-[13px] font-black tabular-nums leading-none ${awayWon ? "text-foreground" : isFinished || isLive ? "text-muted-foreground/60" : "text-muted-foreground/30"}`}>
          {score(match.result.awayGoals)}
        </span>
      </div>
      <div className="mt-1.5 pt-1 border-t border-border/20 flex items-center gap-1">
        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
        <span className="text-[9px] text-muted-foreground/45 font-semibold">
          {isLive ? "Ao vivo" : `J#${match.matchNumber}`}
        </span>
      </div>
    </div>
  )
}

// ── bracket column ────────────────────────────────────────────────────────────
function BracketCol({ slots, slotH }: { slots: (Match | null)[]; slotH: number }) {
  return (
    <div style={{ height: BH, width: CW }} className="flex flex-col shrink-0">
      {slots.map((m, i) => (
        <div key={i} style={{ height: slotH }} className="flex items-center justify-center">
          <BracketCard match={m} />
        </div>
      ))}
    </div>
  )
}

// ── left connector: match pairs → next round  ( "]" shape ) ──────────────────
function ConnL({ pairs, ph }: { pairs: number; ph: number }) {
  return (
    <div style={{ width: XW, height: pairs * ph }} className="relative shrink-0">
      {Array.from({ length: pairs }).map((_, idx) => (
        <div key={idx} style={{ position: "absolute", top: idx * ph, height: ph, left: 0, right: 0 }}>
          {/* "]" bracket: right + top + bottom borders */}
          <div
            style={{
              position: "absolute",
              top: ph / 4,
              height: ph / 2,
              left: 0,
              right: 8,
              border: `2px solid ${BORDER}`,
              borderLeft: "none",
              borderRadius: `0 ${BR}px ${BR}px 0`,
            }}
          />
          {/* Horizontal output line */}
          <div
            style={{
              position: "absolute",
              top: ph / 2 - 1,
              left: XW - 8,
              right: 0,
              borderTop: `2px solid ${BORDER}`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ── right connector: next round → match pairs  ( "[" shape ) ─────────────────
function ConnR({ pairs, ph }: { pairs: number; ph: number }) {
  return (
    <div style={{ width: XW, height: pairs * ph }} className="relative shrink-0">
      {Array.from({ length: pairs }).map((_, idx) => (
        <div key={idx} style={{ position: "absolute", top: idx * ph, height: ph, left: 0, right: 0 }}>
          {/* "[" bracket: left + top + bottom borders */}
          <div
            style={{
              position: "absolute",
              top: ph / 4,
              height: ph / 2,
              left: 8,
              right: 0,
              border: `2px solid ${BORDER}`,
              borderRight: "none",
              borderRadius: `${BR}px 0 0 ${BR}px`,
            }}
          />
          {/* Horizontal input line */}
          <div
            style={{
              position: "absolute",
              top: ph / 2 - 1,
              left: 0,
              right: XW - 8,
              borderTop: `2px solid ${BORDER}`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ── simple horizontal connector (semi → final) ────────────────────────────────
function ConnH() {
  return (
    <div style={{ width: XW, height: BH }} className="relative shrink-0">
      <div
        style={{
          position: "absolute",
          top: BH / 2 - 1,
          left: 0,
          right: 0,
          borderTop: `2px solid ${BORDER}`,
        }}
      />
    </div>
  )
}

// ── center section: Final + Terceiro ─────────────────────────────────────────
function CenterSection({ finalMatch, terceiro }: { finalMatch: Match | null; terceiro: Match | null }) {
  const isFinished = finalMatch?.status === "finished"
  const hasResult = finalMatch ? finalMatch.result.homeGoals !== null : false
  const homeWins = isFinished && hasResult && finalMatch!.result.homeGoals! > finalMatch!.result.awayGoals!
  const awayWins = isFinished && hasResult && finalMatch!.result.awayGoals! > finalMatch!.result.homeGoals!

  return (
    <div className="flex flex-col shrink-0 items-center" style={{ height: BH + 110 }}>
      {/* Final (centered in BH) */}
      <div style={{ height: BH }} className="flex flex-col items-center justify-center">
        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2.5">⭐ FINAL</p>

        {finalMatch ? (
          <div
            style={{ width: CW + 40 }}
            className="rounded-2xl border border-primary/40 bg-primary/8 px-3 py-3 shadow-lg shadow-primary/10"
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xl leading-none">{finalMatch.homeTeam.flag}</span>
                <span className={`text-[12px] font-black truncate ${homeWins ? "text-foreground" : "text-foreground/70"}`}>
                  {finalMatch.homeTeam.code}
                </span>
              </div>
              <span className="text-[15px] font-black tabular-nums">
                {isFinished && hasResult ? finalMatch.result.homeGoals : "–"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xl leading-none">{finalMatch.awayTeam.flag}</span>
                <span className={`text-[12px] font-black truncate ${awayWins ? "text-foreground" : "text-foreground/70"}`}>
                  {finalMatch.awayTeam.code}
                </span>
              </div>
              <span className="text-[15px] font-black tabular-nums">
                {isFinished && hasResult ? finalMatch.result.awayGoals : "–"}
              </span>
            </div>
            {isFinished && hasResult && (
              <div className="mt-2 pt-2 border-t border-primary/20 text-center">
                <span className="text-[9px] font-black text-primary tracking-wide">
                  🏆 {homeWins ? finalMatch.homeTeam.code : finalMatch.awayTeam.code} CAMPEÃO
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{ width: CW + 40 }}
            className="h-[92px] rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex items-center justify-center"
          >
            <span className="text-[10px] text-primary/40 font-bold">A definir</span>
          </div>
        )}
      </div>

      {/* 3rd place (below bracket) */}
      <div style={{ height: 110 }} className="flex flex-col items-center justify-center gap-1.5">
        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">3º Lugar</p>
        <BracketCard match={terceiro} />
      </div>
    </div>
  )
}

// ── column header label ───────────────────────────────────────────────────────
function ColHeader({ label, width, primary }: { label: string; width: number; primary?: boolean }) {
  return (
    <div style={{ width, flexShrink: 0 }} className="text-center">
      <span className={`text-[9px] font-black uppercase tracking-widest ${primary ? "text-primary" : "text-muted-foreground/50"}`}>
        {label}
      </span>
    </div>
  )
}

// ── loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="p-4 pt-5 space-y-4">
      <div className="h-7 w-36 rounded-lg bg-secondary/60 animate-pulse" />
      <div className="h-4 w-56 rounded bg-secondary/40 animate-pulse" />
      <div className="overflow-hidden flex gap-3 mt-6">
        {[4, 2, 1].map((rows, ci) => (
          <div key={ci} className="flex flex-col gap-3">
            {Array.from({ length: rows }).map((_, ri) => (
              <div
                key={ri}
                style={{ height: BH / 4, width: CW }}
                className="rounded-xl bg-secondary/40 animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function ChaveamentoPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then(setMatches)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const byPhase = useMemo(() => {
    const sorted = (phase: string) =>
      matches.filter((m) => m.phase === phase).sort((a, b) => a.matchNumber - b.matchNumber)
    return {
      oitavas:  sorted("oitavas"),
      quartas:  sorted("quartas"),
      semi:     sorted("semi"),
      terceiro: sorted("terceiro"),
      final:    sorted("final"),
    }
  }, [matches])

  function pad(arr: Match[], size: number): (Match | null)[] {
    return [...arr, ...Array(Math.max(0, size - arr.length)).fill(null)] as (Match | null)[]
  }

  const oitavasLeft  = pad(byPhase.oitavas.slice(0, 4), 4)
  const oitavasRight = pad(byPhase.oitavas.slice(4, 8), 4)
  const quartasLeft  = pad(byPhase.quartas.slice(0, 2), 2)
  const quartasRight = pad(byPhase.quartas.slice(2, 4), 2)
  const semiLeft     = pad(byPhase.semi.slice(0, 1), 1)
  const semiRight    = pad(byPhase.semi.slice(1, 2), 1)
  const finalMatch   = byPhase.final[0]   ?? null
  const terceiroMatch = byPhase.terceiro[0] ?? null

  const hasKnockout =
    byPhase.oitavas.length > 0 ||
    byPhase.quartas.length > 0 ||
    byPhase.semi.length > 0 ||
    byPhase.final.length > 0

  if (loading) return <LoadingSkeleton />

  if (!hasKnockout) {
    return (
      <div className="p-4 pt-5 flex flex-col items-center justify-center min-h-[65vh] gap-3 text-center">
        <span className="text-4xl">⚔️</span>
        <h2 className="text-xl font-black">Chaveamento em breve</h2>
        <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
          Os jogos do mata-mata ainda não foram definidos. Volte quando os 16 avos de final começarem!
        </p>
      </div>
    )
  }

  return (
    <div className="pt-5 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 mb-5"
      >
        <h1 className="text-xl font-black">Chaveamento</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Oitavas · Quartas · Semifinal · Final
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="overflow-x-auto scrollbar-primary pb-2"
      >
        <div className="inline-flex flex-col px-4">
          {/* Column headers */}
          <div className="flex items-center gap-0 mb-3">
            <ColHeader label="Oitavas" width={CW} />
            <ColHeader label="" width={XW} />
            <ColHeader label="Quartas" width={CW} />
            <ColHeader label="" width={XW} />
            <ColHeader label="Semi" width={CW} />
            <ColHeader label="" width={XW} />
            <ColHeader label="⭐ Final" width={CW + 40} primary />
            <ColHeader label="" width={XW} />
            <ColHeader label="Semi" width={CW} />
            <ColHeader label="" width={XW} />
            <ColHeader label="Quartas" width={CW} />
            <ColHeader label="" width={XW} />
            <ColHeader label="Oitavas" width={CW} />
          </div>

          {/* Bracket */}
          <div className="flex items-start">
            {/* Left half: oitavas → quartas → semi */}
            <BracketCol slots={oitavasLeft} slotH={SH} />
            <ConnL pairs={2} ph={2 * SH} />
            <BracketCol slots={quartasLeft} slotH={2 * SH} />
            <ConnL pairs={1} ph={4 * SH} />
            <BracketCol slots={semiLeft} slotH={4 * SH} />
            <ConnH />

            {/* Center */}
            <CenterSection finalMatch={finalMatch} terceiro={terceiroMatch} />

            {/* Right half: semi → quartas → oitavas */}
            <ConnH />
            <BracketCol slots={semiRight} slotH={4 * SH} />
            <ConnR pairs={1} ph={4 * SH} />
            <BracketCol slots={quartasRight} slotH={2 * SH} />
            <ConnR pairs={2} ph={2 * SH} />
            <BracketCol slots={oitavasRight} slotH={SH} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
