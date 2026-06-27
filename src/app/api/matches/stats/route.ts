import { NextResponse } from "next/server"
import { getMatches, getPredictions } from "@/lib/db"

export async function GET() {
  const [matches, predictions] = await Promise.all([getMatches(), getPredictions()])

  const finished = matches.filter(
    (m) => m.status === "finished" && m.result.homeGoals !== null
  )

  const predsByMatch = new Map<string, number>()
  for (const p of predictions) {
    predsByMatch.set(p.matchId, (predsByMatch.get(p.matchId) ?? 0) + p.points)
  }

  const stats = finished
    .map((m) => ({
      matchId: m.id,
      matchNumber: m.matchNumber,
      label: `J${m.matchNumber}`,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      scheduledAt: m.scheduledAt,
      totalPoints: predsByMatch.get(m.id) ?? 0,
    }))
    .sort((a, b) => a.matchNumber - b.matchNumber)

  return NextResponse.json(stats)
}
