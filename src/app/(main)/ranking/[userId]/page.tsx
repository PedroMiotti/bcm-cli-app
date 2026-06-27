"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { ArrowLeft, Lock, Target, TrendingUp, Zap, Star } from "lucide-react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
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

type ProgressionPoint = { matchNum: number; cumulative: number }

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function firstName(displayName: string) {
  return displayName.split(" ")[0]
}

function buildProgressionSeries(items: PredictionItem[]): ProgressionPoint[] {
  let cumulative = 0
  return items
    .filter((i) => i.match.status === "finished" && i.prediction !== null)
    .sort((a, b) => a.match.matchNumber - b.match.matchNumber)
    .map((item) => {
      cumulative += item.prediction!.points
      return { matchNum: item.match.matchNumber, cumulative }
    })
}

function getCumulativeAt(series: ProgressionPoint[], matchNum: number): number {
  let last = 0
  for (const point of series) {
    if (point.matchNum <= matchNum) last = point.cumulative
    else break
  }
  return last
}

function buildMultiLineData(playerSeries: Map<string, ProgressionPoint[]>): { label: string; [key: string]: number | string }[] {
  const allMatchNums = new Set<number>()
  for (const series of playerSeries.values()) {
    series.forEach((p) => allMatchNums.add(p.matchNum))
  }
  if (allMatchNums.size === 0) return []

  return Array.from(allMatchNums)
    .sort((a, b) => a - b)
    .map((matchNum) => {
      const row: { label: string; [key: string]: number | string } = { label: `J${matchNum}` }
      for (const [uid, series] of playerSeries) {
        row[uid] = getCumulativeAt(series, matchNum)
      }
      return row
    })
}

const MEDAL_ICONS = ["🥇", "🥈", "🥉"]

const COMPARISON_COLORS = ["#f43f5e", "#a855f7", "#f97316", "#60a5fa", "#facc15", "#14b8a6", "#ec4899", "#84cc16"]

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

// Theme colors
const C = {
  primary: "#009C3B",
  muted: "#7a8a97",
  border: "#1e2d38",
  card: "#0c1318",
  fg: "#f5f5f5",
}

function CustomTooltipLine({ active, payload, label }: {
  active?: boolean
  payload?: { dataKey: string; value: number; color: string; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const sorted = [...payload].sort((a, b) => b.value - a.value)
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }} className="px-3 py-2 text-xs space-y-1">
      <p style={{ color: C.muted }} className="font-bold">{label}</p>
      {sorted.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: <span className="font-black">{p.value} pts</span>
        </p>
      ))}
    </div>
  )
}

function CustomTooltipBar({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }} className="px-3 py-2 text-xs space-y-1">
      <p style={{ color: C.muted }} className="font-bold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function PlayerStatsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()

  const [entry, setEntry] = useState<RankingEntry | null>(null)
  const [items, setItems] = useState<PredictionItem[]>([])
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // ── Comparison state ───────────────────────────────────────────────────────
  const [comparedPlayerIds, setComparedPlayerIds] = useState<Set<string>>(new Set())
  const [comparedItemsCache, setComparedItemsCache] = useState<Map<string, PredictionItem[]>>(new Map())
  const [loadingPlayerIds, setLoadingPlayerIds] = useState<Set<string>>(new Set())
  const [chartTab, setChartTab] = useState<"por-jogo" | "por-dia">("por-jogo")

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${userId}/predictions`).then((r) => r.json()),
      fetch("/api/ranking").then((r) => r.json()),
    ]).then(([predictions, rankingData]: [PredictionItem[], RankingEntry[]]) => {
      const found = rankingData.find((e) => e.userId === userId)
      if (!found) {
        setNotFound(true)
      } else {
        setItems(predictions)
        setRanking(rankingData)
        setEntry(found)
      }
    }).finally(() => setLoading(false))
  }, [userId])

  function toggleComparison(playerId: string) {
    if (comparedPlayerIds.has(playerId)) {
      setComparedPlayerIds((prev) => {
        const next = new Set(prev)
        next.delete(playerId)
        return next
      })
      return
    }

    setComparedPlayerIds((prev) => new Set([...prev, playerId]))

    if (!comparedItemsCache.has(playerId)) {
      setLoadingPlayerIds((prev) => new Set([...prev, playerId]))
      fetch(`/api/users/${playerId}/predictions`)
        .then((r) => r.json())
        .then((data: PredictionItem[]) => {
          setComparedItemsCache((prev) => new Map([...prev, [playerId, data]]))
        })
        .finally(() => {
          setLoadingPlayerIds((prev) => {
            const next = new Set(prev)
            next.delete(playerId)
            return next
          })
        })
    }
  }

  // ── Computed stats ────────────────────────────────────────────────────────
  const finishedWithPred = items.filter((i) => i.match.status === "finished" && i.prediction !== null)
  const withPoints = finishedWithPred.filter((i) => i.prediction!.points > 0)
  const accuracy = finishedWithPred.length > 0
    ? Math.round((withPoints.length / finishedWithPred.length) * 100)
    : 0
  const avgPts = finishedWithPred.length > 0 && entry
    ? parseFloat((entry.totalPoints / finishedWithPred.length).toFixed(1))
    : 0

  const bestType = entry
    ? entry.breakdown.exact > 0 ? "Placar Exato"
      : entry.breakdown.winnerPlusGoals > 0 ? "Vencedor + Gols"
      : entry.breakdown.winner > 0 ? "Vencedor"
      : entry.breakdown.oneTeamGoals > 0 ? "1 Placar"
      : "—"
    : "—"

  // ── By-day data (for secondary chart tab) ─────────────────────────────────
  const byDayData = (() => {
    const grouped = new Map<string, { date: string; points: number; ts: number }>()
    for (const item of finishedWithPred) {
      if (!item.prediction) continue
      const d = new Date(item.match.scheduledAt)
      const label = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo",
      }).format(d)
      const existing = grouped.get(label)
      if (existing) existing.points += item.prediction.points
      else grouped.set(label, { date: label, points: item.prediction.points, ts: d.getTime() })
    }
    return Array.from(grouped.values())
      .sort((a, b) => a.ts - b.ts)
      .map(({ date, points }) => ({ date, points }))
  })()

  // Color map: assign stable colors to comparison players by their position in ranking
  const otherPlayers = ranking.filter((e) => e.userId !== userId)
  const playerColorMap = new Map<string, string>([[userId, C.primary]])
  otherPlayers.forEach((e, i) => {
    playerColorMap.set(e.userId, COMPARISON_COLORS[i % COMPARISON_COLORS.length])
  })

  // Multi-line chart data (current + all loaded comparison players)
  const playerSeriesMap = new Map<string, ProgressionPoint[]>([[userId, buildProgressionSeries(items)]])
  for (const pid of comparedPlayerIds) {
    const pItems = comparedItemsCache.get(pid)
    if (pItems) playerSeriesMap.set(pid, buildProgressionSeries(pItems))
  }
  const multiLineData = buildMultiLineData(playerSeriesMap)
  const hasMultipleLines = comparedPlayerIds.size > 0

  // Group average comparison for bar chart
  const groupAvgBreakdown = ranking.length > 0 ? {
    exact: ranking.reduce((s, e) => s + e.breakdown.exact, 0) / ranking.length,
    winnerPlusGoals: ranking.reduce((s, e) => s + e.breakdown.winnerPlusGoals, 0) / ranking.length,
    winner: ranking.reduce((s, e) => s + e.breakdown.winner, 0) / ranking.length,
    oneTeamGoals: ranking.reduce((s, e) => s + e.breakdown.oneTeamGoals, 0) / ranking.length,
  } : null

  const barComparisonData = entry && groupAvgBreakdown ? [
    { name: "18 pts", Você: entry.breakdown.exact, Média: parseFloat(groupAvgBreakdown.exact.toFixed(1)) },
    { name: "12 pts", Você: entry.breakdown.winnerPlusGoals, Média: parseFloat(groupAvgBreakdown.winnerPlusGoals.toFixed(1)) },
    { name: "9 pts", Você: entry.breakdown.winner, Média: parseFloat(groupAvgBreakdown.winner.toFixed(1)) },
    { name: "3 pts", Você: entry.breakdown.oneTeamGoals, Média: parseFloat(groupAvgBreakdown.oneTeamGoals.toFixed(1)) },
  ] : []

  const finishedItems = items.filter((i) => i.match.status === "finished")
  const upcomingItems = items.filter((i) => i.match.status !== "finished")

  function ChartTabToggle() {
    return (
      <div className="flex gap-0.5 bg-secondary/60 rounded-lg p-0.5">
        {(["por-jogo", "por-dia"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setChartTab(tab)}
            className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
              chartTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "por-jogo" ? "Por Jogo" : "Por Dia"}
          </button>
        ))}
      </div>
    )
  }

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 pt-5 space-y-3">
        <div className="h-9 w-24 rounded-xl bg-secondary/60 animate-pulse" />
        <div className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-secondary/40 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        <div className="h-52 rounded-2xl bg-secondary/40 animate-pulse" />
        <div className="h-60 rounded-2xl bg-secondary/40 animate-pulse" />
      </div>
    )
  }

  if (notFound || !entry) {
    return (
      <div className="p-4 pt-5 flex flex-col gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground w-fit">
          <ArrowLeft size={15} />
          Ranking
        </button>
        <div className="text-center py-16 text-muted-foreground text-sm">Jogador não encontrado.</div>
      </div>
    )
  }

  const medalIcon = entry.position <= 3 ? MEDAL_ICONS[entry.position - 1] : null

  return (
    <div className="flex flex-col gap-4 p-4 pt-5 pb-10">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground w-fit hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        Ranking
      </motion.button>

      {/* Player header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border/60 rounded-2xl px-4 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-black text-primary shrink-0">
            {getInitials(entry.displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-black truncate">{entry.displayName}</p>
              {medalIcon && <span className="text-lg">{medalIcon}</span>}
            </div>
            <p className="text-[11px] text-muted-foreground">@{entry.username}</p>
            <p className="text-[11px] text-muted-foreground">{entry.position}º lugar da turma</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-primary tabular-nums">{entry.totalPoints}</p>
            <p className="text-[10px] text-muted-foreground">pontos</p>
          </div>
        </div>

        {/* Breakdown chips */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {[
            { key: "exact", label: "18", count: entry.breakdown.exact, color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
            { key: "winnerPlusGoals", label: "12", count: entry.breakdown.winnerPlusGoals, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
            { key: "winner", label: "9", count: entry.breakdown.winner, color: "text-green-400 bg-green-400/10 border-green-400/20" },
            { key: "oneTeamGoals", label: "3", count: entry.breakdown.oneTeamGoals, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
          ].map(({ key, label, count, color }) => (
            <div key={key} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ${color}`}>
              <span>{count}×</span>
              <span>+{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <StatCard
          icon={<Target size={15} />}
          label="Palpites feitos"
          value={`${items.length}`}
          sub={`${finishedWithPred.length} finalizados`}
          color="text-blue-400"
        />
        <StatCard
          icon={<TrendingUp size={15} />}
          label="Acurácia"
          value={`${accuracy}%`}
          sub={`${withPoints.length} de ${finishedWithPred.length} jogos`}
          color="text-green-400"
        />
        <StatCard
          icon={<Zap size={15} />}
          label="Média pts/jogo"
          value={`${avgPts}`}
          sub="em jogos finalizados"
          color="text-yellow-400"
        />
        <StatCard
          icon={<Star size={15} />}
          label="Melhor resultado"
          value=""
          sub={bestType !== "—" ? bestType : "Nenhum ainda"}
          fullValue={bestType !== "—" ? bestType : undefined}
          color="text-orange-400"
        />
      </motion.div>

      {/* Line chart: cumulative points */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border/60 rounded-2xl p-4"
      >
        {/* Header + tab toggle */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Pontos Acumulados
          </h3>
          <ChartTabToggle />
        </div>

        {/* Por Jogo tab */}
        {chartTab === "por-jogo" && (
          <>
            {/* Player comparison selector */}
            {otherPlayers.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-muted-foreground mb-2">Comparar com:</p>
                <div className="flex gap-2 flex-wrap">
                  {otherPlayers.map((pEntry) => {
                    const isSelected = comparedPlayerIds.has(pEntry.userId)
                    const isLoading = loadingPlayerIds.has(pEntry.userId)
                    const color = playerColorMap.get(pEntry.userId) ?? C.muted
                    return (
                      <button
                        key={pEntry.userId}
                        onClick={() => toggleComparison(pEntry.userId)}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
                          isSelected
                            ? "bg-card border-border/80 text-foreground"
                            : "bg-secondary/40 border-border/30 text-muted-foreground hover:border-border/60"
                        }`}
                      >
                        {isLoading ? (
                          <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full shrink-0 transition-colors"
                            style={{ background: isSelected ? color : C.muted }}
                          />
                        )}
                        {firstName(pEntry.displayName)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {multiLineData.length < 2 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                {multiLineData.length === 0
                  ? "Ainda não há jogos finalizados"
                  : "Aguardando mais jogos..."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={hasMultipleLines ? 200 : 170}>
                <LineChart data={multiLineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: C.muted, fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltipLine />} cursor={{ stroke: C.border }} />
                  {hasMultipleLines && (
                    <Legend
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: 10, color: C.muted, paddingTop: 8 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey={userId}
                    name={firstName(entry.displayName)}
                    stroke={C.primary}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: C.primary, stroke: C.card, strokeWidth: 2 }}
                  />
                  {Array.from(comparedPlayerIds).map((pid) => {
                    if (!comparedItemsCache.has(pid)) return null
                    const pEntry = ranking.find((e) => e.userId === pid)
                    const color = playerColorMap.get(pid) ?? C.muted
                    return (
                      <Line
                        key={pid}
                        type="monotone"
                        dataKey={pid}
                        name={pEntry ? firstName(pEntry.displayName) : "?"}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color, stroke: C.card, strokeWidth: 2 }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {/* Por Dia tab */}
        {chartTab === "por-dia" && (
          byDayData.length < 2 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Aguardando mais jogos finalizados…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={byDayData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: C.muted, fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }} className="px-3 py-2 text-xs">
                        <p style={{ color: C.muted }} className="font-bold mb-1">{label}</p>
                        <p style={{ color: C.primary }} className="font-black">{payload[0].value} pts</p>
                      </div>
                    )
                  }}
                  cursor={{ fill: `${C.border}60` }}
                />
                <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                  {byDayData.map((_, i) => (
                    <Cell key={i} fill={C.primary} opacity={0.75 + (i / byDayData.length) * 0.25} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        )}
      </motion.div>

      {/* Bar chart: comparison with group average */}
      {barComparisonData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border/60 rounded-2xl p-4"
        >
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Comparação com a Turma
          </h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={barComparisonData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: C.muted, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: C.muted, fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={true}
              />
              <Tooltip content={<CustomTooltipBar />} cursor={{ fill: `${C.border}40` }} />
              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ fontSize: 10, color: C.muted, paddingTop: 8 }}
              />
              <Bar dataKey="Você" fill={C.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Média" fill={C.muted} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Predictions list */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-2"
        >
          {finishedItems.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Jogos Finalizados ({finishedItems.length})
              </p>
              {finishedItems.map((item, i) => (
                <PredictionRow key={item.match.id} item={item} index={i} />
              ))}
            </>
          )}
          {upcomingItems.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Próximos Jogos ({upcomingItems.length})
              </p>
              {upcomingItems.map((item, i) => (
                <PredictionRow key={item.match.id} item={item} index={finishedItems.length + i} />
              ))}
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  fullValue,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: string
  fullValue?: string
}) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 flex flex-col gap-1">
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      {fullValue ? (
        <p className="text-sm font-black leading-tight mt-0.5">{fullValue}</p>
      ) : (
        <p className="text-2xl font-black tabular-nums">{value}</p>
      )}
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
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
      transition={{ delay: index * 0.025 }}
      className="bg-secondary/60 rounded-xl border border-border/30 px-3 py-2.5"
    >
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

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-lg">{match.homeTeam.flag}</span>
          <span className="text-xs font-bold truncate">{match.homeTeam.code}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold truncate">{match.awayTeam.code}</span>
          <span className="text-lg">{match.awayTeam.flag}</span>
        </div>
      </div>

      {prediction && isFinished && (
        <div className="flex justify-center mt-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${TYPE_STYLE[prediction.pointType]}`}>
            {prediction.points > 0 ? `+${TYPE_LABEL[prediction.pointType]} pts` : "0 pts"} · {TYPE_NAME[prediction.pointType]}
          </span>
        </div>
      )}
    </motion.div>
  )
}
