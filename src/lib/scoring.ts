import type { PointBreakdown, PointType } from "./types"

export const POINTS = {
  EXACT: 18,
  WINNER_PLUS_GOALS: 12,
  WINNER: 9,
  ONE_TEAM_GOALS: 3,
  ZERO: 0,
} as const

function getWinner(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home"
  if (away > home) return "away"
  return "draw"
}

export function calculatePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): PointBreakdown {
  // Exact score
  if (predHome === realHome && predAway === realAway) {
    return { type: "exact", value: POINTS.EXACT }
  }

  const predWinner = getWinner(predHome, predAway)
  const realWinner = getWinner(realHome, realAway)
  const correctWinner = predWinner === realWinner

  const homeGoalsMatch = predHome === realHome && realHome > 0
  const awayGoalsMatch = predAway === realAway && realAway > 0

  // Winner + goals of one team (zero goals don't count as a meaningful match)
  if (correctWinner && (homeGoalsMatch || awayGoalsMatch)) {
    return { type: "winner_plus_goals", value: POINTS.WINNER_PLUS_GOALS }
  }

  // Correct winner only
  if (correctWinner) {
    return { type: "winner", value: POINTS.WINNER }
  }

  // Wrong winner but got one team's score right (zero goals don't count)
  if (homeGoalsMatch || awayGoalsMatch) {
    return { type: "one_team_goals", value: POINTS.ONE_TEAM_GOALS }
  }

  return { type: "zero", value: POINTS.ZERO }
}

export const POINT_TYPE_LABELS: Record<PointType, string> = {
  exact: "Placar Exato",
  winner_plus_goals: "Vencedor + Gols",
  winner: "Vencedor",
  one_team_goals: "1 Placar",
  zero: "Sem pontos",
}
