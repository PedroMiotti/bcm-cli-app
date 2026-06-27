"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MousePointerClick } from "lucide-react"
import { ModalDrawer } from "@/components/ModalDrawer"
import { useAuthStore } from "@/store/auth"
import type { RankingEntry } from "@/lib/types"

interface TeamInfo {
  name: string
  code: string
  flag: string
}

interface MatchHighlight {
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  result: string
  exactCount?: number
  zeroCount?: number
  playerCount?: number
}

interface MyStats {
  totalPoints: number
  position: number
  accuracy: number
  exactCount: number
  avgPts: number
  totalMissed: number
  beatPercent: number
  bestGame: { homeTeam: TeamInfo; awayTeam: TeamInfo; points: number; type: string } | null
  myMostPredicted: string | null
}

interface RetroData {
  totalMatches: number
  totalPredictions: number
  totalExact: number
  avgPts: number
  ranking: RankingEntry[]
  mvp: { userId: string; displayName: string; totalPoints: number } | null
  exactKing: { userId: string; displayName: string; exactCount: number } | null
  mostExactMatch: MatchHighlight | null
  hardestMatch: MatchHighlight | null
  mostPredictedScore: string | null
  accuracyKing: { userId: string; displayName: string; accuracy: number } | null
  avgKing: { userId: string; displayName: string; avgPts: number } | null
  myStats: MyStats | null
}

const TYPE_LABEL: Record<string, string> = {
  exact: "Placar Exato",
  winner_plus_goals: "Vencedor + Gols",
  winner: "Vencedor",
  one_team_goals: "1 Placar",
}

const MEDAL_ICONS = ["🥇", "🥈", "🥉"]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function RetrospectivaModal({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<"turma" | "eu">("turma")
  const [data, setData] = useState<RetroData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || data) return
    setLoading(true)
    const url = user
      ? `/api/retrospective/grupo?userId=${user.id}`
      : "/api/retrospective/grupo"
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [open, user, data])

  return (
    <ModalDrawer open={open} onOpenChange={(o) => !o && onClose()} title="Retrospecto · Fase de Grupos">
      {/* Header */}
      <div className="bg-secondary/50 px-5 pt-5 pb-4 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl leading-none">🏆</span>
          <div>
            <p className="text-sm font-black">Retrospecto · Fase de Grupos</p>
            <p className="text-[11px] text-muted-foreground">Os destaques da nossa turma</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-secondary/60 rounded-xl p-1">
          {(["turma", "eu"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all duration-200 ${
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "turma" ? "🫂 A Turma" : "👤 Eu"}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">Carregando retrospecto...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Nenhum dado encontrado.
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === "turma" ? (
              <TurmaTab key="turma" data={data} currentUserId={user?.id ?? null} onClose={onClose} />
            ) : (
              <EuTab key="eu" data={data} user={user} />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/40 p-4">
        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground font-bold text-sm rounded-xl py-3 hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
        >
          Fechar
        </button>
      </div>
    </ModalDrawer>
  )
}

function TurmaTab({ data, currentUserId, onClose }: { data: RetroData; currentUserId: string | null; onClose: () => void }) {
  const router = useRouter()
  const { totalMatches, totalExact, avgPts, ranking, mvp, exactKing, accuracyKing, avgKing, mostExactMatch, hardestMatch, mostPredictedScore } = data

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      {/* Hero numbers */}
      <div className="grid grid-cols-3 gap-2">
        <StatMini value={totalMatches} label="jogos" />
        <StatMini value={totalExact} label="exatos" color="text-orange-400" />
        <StatMini value={`${avgPts}`} label="pts/jogo" color="text-primary" />
      </div>

      {/* Awards */}
      {(mvp || (exactKing && exactKing.exactCount > 0) || accuracyKing || avgKing) && (
        <div className="space-y-2">
          <SectionLabel>Destaques</SectionLabel>
          {mvp && (
            <AwardCard
              icon="🏆"
              label="Craque da Fase"
              name={mvp.displayName}
              value={`${mvp.totalPoints} pts`}
              color="text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
            />
          )}
          {exactKing && exactKing.exactCount > 0 && (
            <AwardCard
              icon="🎯"
              label="Rei dos Exatos"
              name={exactKing.displayName}
              value={`${exactKing.exactCount}× exato`}
              color="text-orange-400 bg-orange-400/10 border-orange-400/20"
            />
          )}
          {accuracyKing && (
            <AwardCard
              icon="✅"
              label="Maior Acurácia"
              name={accuracyKing.displayName}
              value={`${accuracyKing.accuracy}%`}
              color="text-green-400 bg-green-400/10 border-green-400/20"
            />
          )}
          {avgKing && (
            <AwardCard
              icon="📈"
              label="Melhor Média"
              name={avgKing.displayName}
              value={`${avgKing.avgPts} pts/jogo`}
              color="text-blue-400 bg-blue-400/10 border-blue-400/20"
            />
          )}
        </div>
      )}

      {/* Match highlights */}
      {(mostExactMatch || hardestMatch) && (
        <div className="space-y-2">
          <SectionLabel>Partidas</SectionLabel>
          {mostExactMatch && (mostExactMatch.exactCount ?? 0) > 0 && (
            <RetroMatchCard
              emoji="🎯"
              label="Mais acertada"
              match={mostExactMatch}
              subLabel={`${mostExactMatch.exactCount} placares exatos`}
              subColor="text-orange-400"
            />
          )}
          {hardestMatch && (
            <RetroMatchCard
              emoji="😰"
              label="Mais difícil"
              match={hardestMatch}
              subLabel={`${hardestMatch.zeroCount} zerados`}
              subColor="text-red-400"
            />
          )}
        </div>
      )}

      {/* Most predicted score */}
      {mostPredictedScore && (
        <div className="bg-secondary/50 rounded-2xl border border-border/30 p-4 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            🔮 Placar favorito da turma
          </p>
          <p className="text-3xl font-black tabular-nums">
            {mostPredictedScore.replace("-", " × ")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">o mais palpitado da fase</p>
        </div>
      )}

      {/* Mini ranking */}
      {ranking.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Classificação Final</SectionLabel>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MousePointerClick size={10} />
              <span>Toque para ver os stats</span>
            </div>
          </div>
          <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
            {ranking.map((entry, i) => {
              const isMe = entry.userId === currentUserId
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  onClick={() => { onClose(); router.push(`/ranking/${entry.userId}`) }}
                  className={`flex items-center gap-3 px-3 py-2.5 border-b border-border/20 last:border-0 cursor-pointer active:scale-[0.99] transition-colors ${
                    isMe
                      ? "bg-primary/8 border-l-2 border-l-primary hover:bg-primary/12"
                      : "hover:bg-secondary/30"
                  }`}
                >
                  <span className="w-5 text-center shrink-0">
                    {i < 3 ? (
                      <span className="text-sm">{MEDAL_ICONS[i]}</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-bold">{entry.position}º</span>
                    )}
                  </span>
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black border ${
                    isMe
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-secondary text-muted-foreground border-border/40"
                  }`}>
                    {getInitials(entry.displayName)}
                  </div>
                  <span className={`flex-1 text-xs font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                    {entry.displayName}
                    {isMe && <span className="text-[10px] text-primary/60 ml-1">· você</span>}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-orange-400 font-bold">{entry.breakdown.exact}×🎯</span>
                    <span className="text-sm font-black tabular-nums text-primary">{entry.totalPoints}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function EuTab({ data, user }: { data: RetroData; user: { id: string; displayName: string } | null }) {
  const { myStats, ranking } = data

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground"
      >
        <span className="text-4xl">🔐</span>
        <p className="text-sm">Faça login para ver suas estatísticas</p>
      </motion.div>
    )
  }

  if (!myStats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground"
      >
        <span className="text-4xl">📭</span>
        <p className="text-sm text-center">Sem dados pessoais para exibir</p>
      </motion.div>
    )
  }

  const posEmoji = myStats.position === 1 ? "🥇" : myStats.position === 2 ? "🥈" : myStats.position === 3 ? "🥉" : "📍"

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      {/* Position hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border/60 rounded-2xl p-5 text-center"
      >
        <span className="text-5xl leading-none">{posEmoji}</span>
        <p className="text-4xl font-black mt-2 tabular-nums">{myStats.position}º</p>
        <p className="text-sm text-muted-foreground">de {ranking.length} participantes</p>
        {myStats.beatPercent > 0 && (
          <div className="mt-3 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 inline-block">
            <p className="text-xs font-bold text-primary">
              Melhor que {myStats.beatPercent}% da turma
            </p>
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <PersonalStatCard emoji="⭐" label="Pontos totais" value={`${myStats.totalPoints}`} sub="fase de grupos" />
        <PersonalStatCard emoji="🎯" label="Acurácia" value={`${myStats.accuracy}%`} sub={`${myStats.exactCount} placar${myStats.exactCount !== 1 ? "es" : ""} exato${myStats.exactCount !== 1 ? "s" : ""}`} valueColor="text-green-400" />
        <PersonalStatCard emoji="📊" label="Média/jogo" value={`${myStats.avgPts}`} sub="pontos por jogo" />
        <PersonalStatCard emoji="😬" label="Zerados" value={`${myStats.totalMissed}`} sub="jogos sem ponto" valueColor={myStats.totalMissed >= 10 ? "text-red-400" : "text-muted-foreground"} />
      </div>

      {/* Best game */}
      {myStats.bestGame && myStats.bestGame.points > 0 && (
        <div className="bg-secondary/50 rounded-2xl border border-border/30 p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            ⚡ Meu melhor jogo
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{myStats.bestGame.homeTeam.flag}</span>
              <span className="text-sm text-muted-foreground font-bold">×</span>
              <span className="text-2xl">{myStats.bestGame.awayTeam.flag}</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-primary">+{myStats.bestGame.points} pts</p>
              <p className="text-[10px] text-muted-foreground">{TYPE_LABEL[myStats.bestGame.type] ?? ""}</p>
            </div>
          </div>
        </div>
      )}

      {/* My most predicted score */}
      {myStats.myMostPredicted && (
        <div className="bg-secondary/50 rounded-2xl border border-border/30 p-4 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            🔮 Meu placar favorito
          </p>
          <p className="text-3xl font-black tabular-nums">
            {myStats.myMostPredicted.replace("-", " × ")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">foi o que mais palpitei</p>
        </div>
      )}
    </motion.div>
  )
}

// ── Small reusable pieces ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{children}</p>
  )
}

function StatMini({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-secondary/50 rounded-xl border border-border/30 p-3 text-center">
      <p className={`text-2xl font-black tabular-nums ${color ?? "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function AwardCard({ icon, label, name, value, color }: {
  icon: string
  label: string
  name: string
  value: string
  color: string
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 ${color}`}>
      <span className="text-2xl shrink-0 leading-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-sm font-black truncate">{name}</p>
      </div>
      <span className="text-xs font-bold shrink-0 opacity-80">{value}</span>
    </div>
  )
}

function RetroMatchCard({ emoji, label, match, subLabel, subColor }: {
  emoji: string
  label: string
  match: MatchHighlight
  subLabel: string
  subColor: string
}) {
  return (
    <div className="bg-secondary/50 rounded-xl border border-border/30 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm leading-none">{emoji}</span>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{match.homeTeam.flag}</span>
          <span className="text-[10px] text-muted-foreground font-bold">×</span>
          <span className="text-xl">{match.awayTeam.flag}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-black tabular-nums">{match.result.replace("-", " × ")}</p>
          <p className={`text-[10px] font-bold ${subColor}`}>{subLabel}</p>
        </div>
      </div>
    </div>
  )
}

function PersonalStatCard({ emoji, label, value, sub, valueColor }: {
  emoji: string
  label: string
  value: string
  sub: string
  valueColor?: string
}) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm leading-none">{emoji}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-black tabular-nums ${valueColor ?? ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  )
}
