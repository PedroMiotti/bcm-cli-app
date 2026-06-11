import { NextResponse } from "next/server"
import { getUsers, getPredictions } from "@/lib/db"
import type { RankingEntry } from "@/lib/types"

export async function GET() {
  const users = getUsers()
  const predictions = await getPredictions()

  const ranking: RankingEntry[] = users.map((user) => {
    const userPredictions = predictions.filter((p) => p.userId === user.id)
    const breakdown = { exact: 0, winnerPlusGoals: 0, winner: 0, oneTeamGoals: 0 }
    let totalPoints = 0

    for (const p of userPredictions) {
      totalPoints += p.points
      if (p.pointBreakdown.type === "exact") breakdown.exact++
      else if (p.pointBreakdown.type === "winner_plus_goals") breakdown.winnerPlusGoals++
      else if (p.pointBreakdown.type === "winner") breakdown.winner++
      else if (p.pointBreakdown.type === "one_team_goals") breakdown.oneTeamGoals++
    }

    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      totalPoints,
      breakdown,
      position: 0,
    }
  })

  ranking.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.breakdown.exact !== a.breakdown.exact) return b.breakdown.exact - a.breakdown.exact
    if (b.breakdown.winnerPlusGoals !== a.breakdown.winnerPlusGoals)
      return b.breakdown.winnerPlusGoals - a.breakdown.winnerPlusGoals
    if (b.breakdown.winner !== a.breakdown.winner) return b.breakdown.winner - a.breakdown.winner
    return b.breakdown.oneTeamGoals - a.breakdown.oneTeamGoals
  })

  ranking.forEach((entry, idx) => {
    entry.position = idx + 1
  })

  return NextResponse.json(ranking)
}
