"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import type { Match, Team } from "@/lib/types"
import { PHASE_LABELS, PHASE_ORDER, type MatchPhase } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Play, CheckCircle2, ChevronUp, ChevronDown, AlertTriangle, Wifi, Clock, Users, Search, X } from "lucide-react"

type StatusFilter = "all" | "scheduled" | "live" | "finished"
type PhaseFilter = MatchPhase | "all" | "today"

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
  editScheduledAt: string
  editHomeTeam?: Team
  editAwayTeam?: Team
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function AdminPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all")
  const [saving, setSaving] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Team picker state
  const [teamPickerFor, setTeamPickerFor] = useState<{ matchId: string; side: "home" | "away" } | null>(null)
  const [teamSearch, setTeamSearch] = useState("")

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/jogos")
  }, [user, router])

  const loadMatches = useCallback(async () => {
    const data: Match[] = await fetch("/api/matches").then((r) => r.json())
    setMatches(data.map((m) => ({
      ...m,
      editHome: m.result.homeGoals ?? 0,
      editAway: m.result.awayGoals ?? 0,
      editScheduledAt: m.scheduledAt.slice(0, 16),
    })))
    setLoading(false)
  }, [])

  useEffect(() => { loadMatches() }, [loadMatches])

  // Derived: unique teams from all matches
  const allTeams = useMemo<Team[]>(() => {
    const seen = new Set<string>()
    const teams: Team[] = []
    for (const m of matches) {
      if (!seen.has(m.homeTeam.code)) { seen.add(m.homeTeam.code); teams.push(m.homeTeam) }
      if (!seen.has(m.awayTeam.code)) { seen.add(m.awayTeam.code); teams.push(m.awayTeam) }
    }
    return teams.sort((a, b) => a.name.localeCompare(b.name))
  }, [matches])

  // Available phases (only those with matches)
  const availablePhases = useMemo<MatchPhase[]>(
    () => PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p)),
    [matches]
  )

  async function updateMatch(
    matchId: string,
    status: Match["status"],
    homeGoals: number,
    awayGoals: number,
    scheduledAt?: string,
    homeTeam?: Team,
    awayTeam?: Team,
  ) {
    setSaving(matchId)
    try {
      await fetch("/api/matches/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, status, homeGoals, awayGoals, scheduledAt, homeTeam, awayTeam }),
      })
      await loadMatches()
    } finally {
      setSaving(null)
      setExpandedId(null)
    }
  }

  async function saveTeams(match: AdminMatch) {
    const ht = match.editHomeTeam
    const at = match.editAwayTeam
    if (!ht && !at) return
    setSaving(match.id)
    try {
      await fetch("/api/matches/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          status: match.status,
          homeGoals: match.result.homeGoals,
          awayGoals: match.result.awayGoals,
          ...(ht && { homeTeam: ht }),
          ...(at && { awayTeam: at }),
        }),
      })
      await loadMatches()
    } finally {
      setSaving(null)
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

  function pickTeam(team: Team) {
    if (!teamPickerFor) return
    const { matchId, side } = teamPickerFor
    setMatches((prev) => prev.map((m) => {
      if (m.id !== matchId) return m
      return side === "home"
        ? { ...m, editHomeTeam: team }
        : { ...m, editAwayTeam: team }
    }))
    setTeamPickerFor(null)
    setTeamSearch("")
  }

  const counts = {
    all: matches.length,
    scheduled: matches.filter((m) => m.status === "scheduled").length,
    live: matches.filter((m) => m.status === "live").length,
    finished: matches.filter((m) => m.status === "finished").length,
  }

  const filtered = matches.filter((m) => {
    const statusOk = filter === "all" || m.status === filter
    const phaseOk = phaseFilter === "all"
      ? true
      : phaseFilter === "today"
        ? isToday(m.scheduledAt)
        : m.phase === phaseFilter
    return statusOk && phaseOk
  })

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase()
    return q ? allTeams.filter((t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)) : allTeams
  }, [allTeams, teamSearch])

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

      {/* Status filter tabs */}
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

      {/* Phase / Today filter chips */}
      {(availablePhases.length > 1 || true) && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {(["all", "today", ...availablePhases] as PhaseFilter[]).map((pf) => {
            const label =
              pf === "all" ? "Todos" :
              pf === "today" ? "Hoje" :
              PHASE_LABELS[pf as MatchPhase]
            const active = phaseFilter === pf
            return (
              <button
                key={pf}
                onClick={() => setPhaseFilter(pf)}
                className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  active
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card border-border/60 text-muted-foreground hover:border-border"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

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
            const effectiveHome = match.editHomeTeam ?? match.homeTeam
            const effectiveAway = match.editAwayTeam ?? match.awayTeam
            const hasTeamEdits = !!(match.editHomeTeam || match.editAwayTeam)
            const groupLabel = match.phase === "grupo"
              ? `G${match.group} #${match.matchNumber}`
              : `${PHASE_LABELS[match.phase]} #${match.matchNumber}`

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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[match.status]}`}>
                    {STATUS_LABEL[match.status]}
                  </span>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-sm">{effectiveHome.flag}</span>
                    <span className="text-xs font-bold truncate">{effectiveHome.code}</span>
                    <span className="text-xs text-muted-foreground font-black">
                      {match.result.homeGoals !== null
                        ? `${match.result.homeGoals} × ${match.result.awayGoals}`
                        : "×"}
                    </span>
                    <span className="text-xs font-bold truncate">{effectiveAway.code}</span>
                    <span className="text-sm">{effectiveAway.flag}</span>
                  </div>

                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {groupLabel}
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
                        {/* Time editor */}
                        <div className="flex items-center gap-3 bg-secondary/40 rounded-xl px-3 py-2">
                          <Clock size={14} className="text-muted-foreground shrink-0" />
                          <label className="text-xs text-muted-foreground shrink-0">Horário</label>
                          <input
                            type="datetime-local"
                            value={match.editScheduledAt}
                            onChange={(e) => setMatches((prev) => prev.map((m) =>
                              m.id !== match.id ? m : { ...m, editScheduledAt: e.target.value }
                            ))}
                            className="flex-1 bg-transparent text-sm font-mono text-foreground outline-none"
                          />
                        </div>

                        {/* Team picker (TBD) */}
                        <div className="rounded-xl border border-border/40 overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border/30">
                            <Users size={12} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Times</span>
                            {hasTeamEdits && (
                              <span className="ml-auto text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                                Editado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 p-3">
                            {/* Home team */}
                            <button
                              onClick={() => {
                                setTeamPickerFor({ matchId: match.id, side: "home" })
                                setTeamSearch("")
                              }}
                              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                                match.editHomeTeam
                                  ? "border-amber-400/40 bg-amber-400/5"
                                  : "border-border/60 bg-secondary/30 hover:bg-secondary/50"
                              }`}
                            >
                              <span className="text-lg">{effectiveHome.flag}</span>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-[11px] font-bold truncate">{effectiveHome.code}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{effectiveHome.name}</p>
                              </div>
                            </button>

                            <span className="text-xs text-muted-foreground font-black shrink-0">×</span>

                            {/* Away team */}
                            <button
                              onClick={() => {
                                setTeamPickerFor({ matchId: match.id, side: "away" })
                                setTeamSearch("")
                              }}
                              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                                match.editAwayTeam
                                  ? "border-amber-400/40 bg-amber-400/5"
                                  : "border-border/60 bg-secondary/30 hover:bg-secondary/50"
                              }`}
                            >
                              <span className="text-lg">{effectiveAway.flag}</span>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-[11px] font-bold truncate">{effectiveAway.code}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{effectiveAway.name}</p>
                              </div>
                            </button>
                          </div>

                          {/* Inline team picker dropdown */}
                          <AnimatePresence>
                            {teamPickerFor?.matchId === match.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden border-t border-border/30"
                              >
                                <div className="p-3 space-y-2">
                                  <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2">
                                    <Search size={12} className="text-muted-foreground shrink-0" />
                                    <input
                                      autoFocus
                                      value={teamSearch}
                                      onChange={(e) => setTeamSearch(e.target.value)}
                                      placeholder={`Buscar ${teamPickerFor.side === "home" ? "mandante" : "visitante"}…`}
                                      className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
                                    />
                                    <button onClick={() => { setTeamPickerFor(null); setTeamSearch("") }}>
                                      <X size={12} className="text-muted-foreground hover:text-foreground transition-colors" />
                                    </button>
                                  </div>
                                  <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
                                    {filteredTeams.map((t) => (
                                      <button
                                        key={t.code}
                                        onClick={() => pickTeam(t)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                                      >
                                        <span className="text-base">{t.flag}</span>
                                        <span className="text-xs font-bold w-8">{t.code}</span>
                                        <span className="text-xs text-muted-foreground">{t.name}</span>
                                      </button>
                                    ))}
                                    {filteredTeams.length === 0 && (
                                      <p className="text-xs text-muted-foreground text-center py-3">Nenhum time encontrado</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Save teams button (only when there are edits) */}
                          {hasTeamEdits && (
                            <div className="px-3 pb-3">
                              <button
                                onClick={() => saveTeams(match)}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 text-sm font-bold hover:bg-amber-400/25 disabled:opacity-60 transition-all"
                              >
                                {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Users size={12} />}
                                Salvar Times
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Score editor */}
                        <div className="flex items-center justify-center gap-6">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{effectiveHome.flag}</span>
                            <span className="text-xs font-bold">{effectiveHome.name}</span>
                          </div>

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

                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{effectiveAway.flag}</span>
                            <span className="text-xs font-bold">{effectiveAway.name}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          {match.status === "scheduled" && (
                            <>
                              <button
                                onClick={() => updateMatch(match.id, "scheduled", match.editHome, match.editAway, match.editScheduledAt)}
                                disabled={isSaving}
                                title="Salvar horário"
                                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 disabled:opacity-60 transition-all"
                              >
                                {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Clock size={13} />}
                              </button>
                              <button
                                onClick={() => updateMatch(match.id, "live", match.editHome, match.editAway, match.editScheduledAt)}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/25 disabled:opacity-60 transition-all"
                              >
                                <Play size={13} />
                                Iniciar Jogo
                              </button>
                              <button
                                onClick={() => updateMatch(match.id, "finished", match.editHome, match.editAway, match.editScheduledAt)}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/25 disabled:opacity-60 transition-all"
                              >
                                {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                {match.editHome} × {match.editAway} — Encerrar
                              </button>
                            </>
                          )}

                          {match.status === "live" && (
                            <button
                              onClick={() => updateMatch(match.id, "finished", match.editHome, match.editAway, match.editScheduledAt)}
                              disabled={isSaving}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/25 disabled:opacity-60 transition-all"
                            >
                              {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                              {match.editHome} × {match.editAway} — Encerrar
                            </button>
                          )}

                          {match.status === "finished" && (
                            <button
                              onClick={() => updateMatch(match.id, "finished", match.editHome, match.editAway, match.editScheduledAt)}
                              disabled={isSaving}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-bold hover:bg-secondary/80 disabled:opacity-60 transition-all"
                            >
                              {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
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
