import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getPredictionsByUser, getMatches } from "@/lib/db"

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/users/[userId]/predictions'>) {
  const { userId } = await ctx.params

  const [predictions, matches] = await Promise.all([
    getPredictionsByUser(userId),
    getMatches(),
  ])

  const predictionsByMatchId = new Map(predictions.map((p) => [p.matchId, p]))

  const result = matches
    .filter((m) => predictionsByMatchId.has(m.id))
    .map((match) => {
      const prediction = predictionsByMatchId.get(match.id)!
      const kickedOff =
        match.status !== "scheduled" ||
        Date.now() >= new Date(match.scheduledAt).getTime()

      return {
        match,
        prediction: kickedOff
          ? {
              homeGoals: prediction.homeGoals,
              awayGoals: prediction.awayGoals,
              points: prediction.points,
              pointType: prediction.pointBreakdown.type,
            }
          : null,
        locked: !kickedOff,
        hasPrediction: true,
      }
    })
    .sort((a, b) => new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime())

  return NextResponse.json(result)
}
