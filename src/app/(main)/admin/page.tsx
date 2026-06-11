"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import type { Match } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Play, CheckCircle2, ChevronUp, ChevronDown, AlertTriangle, Wifi } from "lucide-react"

type StatusFilter = "all" | "scheduled" | "live" | "finished"

const STATUS_LABEL: Record<Match["status"], string> = {
  scheduled: "Agendado",
  live: "Ao Vivo",
  finished: "Encerrado",
}

const STATUS_COLOR: Record<Match["status"], string> = {
  scheduled: "bg-border/60 text-muted-foreground",
  live: "bg-green-500/20 text-green-400 border border-green-500/30",
  finished: "bg-secondary text-muted-foreground",
}

interface SyncResult {
  synced: number
  unchanged: number
  unmatched: number
  details: string[]
  unmatchedList: string[]
  error?: string
}

interface AdminMatch extends Match {
  editHome: number
  editAway: number
}

export default function AdminPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [saving, setSaving] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/jogos")
  }, [user, router])

  const loadMatches = useCallback(async () => {
    const data: Match[] = await fetch("/api/matches").then((r) => r.json())
    setMatches(data.map((m) => ({
      ...m,
      editHome: m.result.homeGoals ?? 0,
      editAway: m.result.awayGoals ?? 0,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { loadMatches() }, [loadMatches])

  async function updateMatch(matchId: string, status: Match["status"], homeGoals: number, awayGoals: number) {
    setSaving(matchId)
    try {
      await fetch("/api/matches/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, status, homeGoals, awayGoals }),
      })
      await loadMatches()
    } finally {
      setSaving(null)
      setExpandedId(null)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" })
      const data = await res.json()
      setSyncResult(data)
      await loadMatches()
    } catch (e) {
      setSyncResult({ synced: 0, unchanged: 0, unmatched: 0, details: [], unmatchedList: [], error: String(e) })
    } finally {
      setSyncing(false)
    }
  }

  function setScore(id: string, side: "home" | "away", delta: number) {
    setMatches((prev) => prev.map((m) => {
      if (m.id !== id) return m
      if (side === "home") return { ...m, editHome: Math.max(0, Math.min(20, m.editHome + delta)) }
      return { ...m, editAway: Math.max(0, Math.min(20, m.editAway + delta)) }
    }))
  }

  const counts = {
    all: matches.length,
    scheduled: matches.filter((m) => m.status === "scheduled").length,
    live: matches.filter((m) => m.status === "live").length,
    finished: matches.filter((m) => m.status === "finished").length,
  }

  const filtered = matches.filter((m) => filter === "all" || m.status === filter)

  if (!user || user.role !== "admin") return null

  return (
    <div className="flex flex-col gap-4 p-4 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">Painel Admin</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie placares e sincronize com a API
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all shrink-0"
        >
          {syncing
            ? <><RefreshCw size={14} className="animate-spin" /> Sincronizando…</>
            : <><Wifi size={14} /> Sincronizar API</>
          }
        </button>
      </div>

      {/* Sync result banner */}
      <AnimatePresence>
        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-2xl p-4 border text-sm ${
              syncResult.error
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-card border-border/60"
            }`}
          >
            {syncResult.error ? (
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Erro na sincronização</p>
                  <p className="text-xs mt-0.5 opacity-80">{syncResult.error}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={15} className="text-green-400" />
                  <span className="font-bold">
                    {syncResult.synced} jogo{syncResult.synced !== 1 ? "s" : ""} atualizados
                    {syncResult.unchanged > 0 && `, ${syncResult.unchanged} sem alteração`}
                    {syncResult.unmatched > 0 && `, ${syncResult.unmatched} não encontrados`}
                  </span>
                </div>
                {syncResult.details.length > 0 && (
                  <ul className="space-y-0.5">
                    {syncResult.details.map((d, i) => (
                      <li key={i} className="text-xs text-muted-foreground font-mono">{d}</li>
                    ))}
                  </ul>
                )}
                {syncResult.unmatchedList.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Não mapeados: {syncResult.unmatchedList.join(", ")}
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {(["all", "scheduled", "live", "finished"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl py-2 px-1 text-center transition-all border ${
              filter === s
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-card border-border/60 text-muted-foreground"
            }`}
          >
            <p className="text-lg font-black tabular-nums">{counts[s]}</p>
            <p className="text-[9px] uppercase tracking-wide leading-tight mt-0.5">
              {s === "all" ? "Total" : s === "scheduled" ? "Agend." : s === "live" ? "Ao Vivo" : "Enc."}
            </p>
          </button>
        ))}
      </div>

      {/* Match list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((match, i) => {
            const isExpanded = expandedId === match.id
            const isSaving = saving === match.id

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-2xl bg-card border border-border/60 overflow-hidden"
              >
                {/* Match row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : match.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors text-left"
                >
                  {/* Status */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[match.status]}`}>
                    {STATUS_LABEL[match.status]}
                  </span>

                  {/* Teams */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-sm">{match.homeTeam.flag}</span>
                    <span className="text-xs font-bold truncate">{match.homeTeam.code}</span>
                    <span className="text-xs text-muted-foreground font-black">
                      {match.result.homeGoals !== null
                        ? `${match.result.homeGoals} × ${match.result.awayGoals}`
                        : "× "}
                    </span>
                    <span className="text-xs font-bold truncate">{match.awayTeam.code}</span>
                    <span className="text-sm">{match.awayTeam.flag}</span>
                  </div>

                  {/* Group + match number */}
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    G{match.group} #{match.matchNumber}
                  </span>

                  <ChevronDown
                    size={14}
                    className={`text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Expanded editor */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border/40"
                    >
                      <div className="px-4 py-4 space-y-4">
                        {/* Teams + score editor */}
                        <div className="flex items-center justify-center gap-6">
                          {/* Home */}
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{match.homeTeam.flag}</span>
                            <span className="text-xs font-bold">{match.homeTeam.name}</span>
                          </div>

                          {/* Score inputs */}
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <button onClick={() => setScore(match.id, "home", 1)} className="w-8 h-7 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                                <ChevronUp size={14} />
                              </button>
                              <span className="text-3xl font-black tabular-nums w-10 text-center">{match.editHome}</span>
                              <button onClick={() => setScore(match.id, "home", -1)} className="w-8 h-7 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                                <ChevronDown size={14} />
                              </button>
                            </div>

                            <span className="text-2xl font-black text-border">×</span>

                            <div className="flex flex-col items-center gap-1">
                              <button onClick={() => setScore(match.id, "away", 1)} className="w-8 h-7 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                                <ChevronUp size={14} />
                              </button>
                              <span className="text-3xl font-black tabular-nums w-10 text-center">{match.editAway}</span>
                              <button onClick={() => setScore(match.id, "away", -1)} className="w-8 h-7 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                                <ChevronDown size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Away */}
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{match.awayTeam.flag}</span>
                            <span className="text-xs font-bold">{match.awayTeam.name}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          {match.status === "scheduled" && (
                            <button
                              onClick={() => updateMatch(match.id, "live", match.editHome, match.editAway)}
                              disabled={isSaving}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/25 disabled:opacity-60 transition-all"
                            >
                              <Play size={13} />
                              Iniciar Jogo
                            </button>
                          )}

                          {(match.status === "live" || match.status === "scheduled") && (
                            <button
                              onClick={() => updateMatch(match.id, "finished", match.editHome, match.editAway)}
                              disabled={isSaving}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/25 disabled:opacity-60 transition-all"
                            >
                              {isSaving
                                ? <RefreshCw size={13} className="animate-spin" />
                                : <CheckCircle2 size={13} />
                              }
                              {match.editHome} × {match.editAway} — Encerrar
                            </button>
                          )}

                          {match.status === "finished" && (
                            <button
                              onClick={() => updateMatch(match.id, "finished", match.editHome, match.editAway)}
                              disabled={isSaving}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-bold hover:bg-secondary/80 disabled:opacity-60 transition-all"
                            >
                              {isSaving
                                ? <RefreshCw size={13} className="animate-spin" />
                                : <CheckCircle2 size={13} />
                              }
                              Salvar Correção
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
