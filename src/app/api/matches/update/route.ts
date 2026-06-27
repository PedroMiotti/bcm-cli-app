import { NextRequest, NextResponse } from "next/server"
import { getMatch, updateMatch, getPredictionsByMatch, upsertPrediction } from "@/lib/db"
import { calculatePoints } from "@/lib/scoring"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { matchId, homeGoals, awayGoals, status, scheduledAt, homeTeam, awayTeam } = body

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 })
  }

  const match = await getMatch(matchId)
  if (!match) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
  }

  await updateMatch(matchId, {
    status: status ?? match.status,
    result: {
      homeGoals: homeGoals ?? match.result.homeGoals,
      awayGoals: awayGoals ?? match.result.awayGoals,
    },
    ...(scheduledAt !== undefined && { scheduledAt }),
    ...(homeTeam !== undefined && { homeTeam }),
    ...(awayTeam !== undefined && { awayTeam }),
  })

  // Recalculate points for all predictions on this match if finished
  if (
    (status === "finished" || match.status === "finished") &&
    homeGoals !== undefined &&
    awayGoals !== undefined
  ) {
    const predictions = await getPredictionsByMatch(matchId)
    for (const pred of predictions) {
      const breakdown = calculatePoints(pred.homeGoals, pred.awayGoals, homeGoals, awayGoals)
      await upsertPrediction({
        ...pred,
        points: breakdown.value,
        pointBreakdown: breakdown,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
