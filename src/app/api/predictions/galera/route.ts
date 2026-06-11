import { NextRequest, NextResponse } from "next/server"
import { getPredictionsByMatch, getUsers, getMatch } from "@/lib/db"

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId")
  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 })
  }

  const match = await getMatch(matchId)
  if (!match) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
  }

  // Reveal predictions once the match has kicked off (status changed OR kickoff time passed)
  const kickedOff =
    match.status !== "scheduled" ||
    Date.now() >= new Date(match.scheduledAt).getTime()

  if (!kickedOff) {
    return NextResponse.json({ locked: true, predictions: [] })
  }

  const predictions = await getPredictionsByMatch(matchId)
  const users = getUsers()

  const result = predictions.map((p) => {
    const user = users.find((u) => u.id === p.userId)
    return {
      displayName: user?.displayName ?? "Desconhecido",
      homeGoals: p.homeGoals,
      awayGoals: p.awayGoals,
      points: p.points,
      pointType: p.pointBreakdown.type,
    }
  })

  return NextResponse.json({ locked: false, predictions: result })
}
