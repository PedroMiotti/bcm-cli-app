import { NextRequest, NextResponse } from "next/server"
import { getPredictionsByUser, upsertPrediction, getMatch } from "@/lib/db"
import type { Prediction } from "@/lib/types"
import { randomUUID } from "crypto"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }
  const predictions = await getPredictionsByUser(userId)
  return NextResponse.json(predictions)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, matchId, homeGoals, awayGoals } = body

  if (
    !userId ||
    !matchId ||
    !Number.isInteger(homeGoals) ||
    !Number.isInteger(awayGoals) ||
    homeGoals < 0 ||
    awayGoals < 0
  ) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  const match = await getMatch(matchId)
  if (!match) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
  }

  if (match.status !== "scheduled") {
    return NextResponse.json({ error: "Palpites bloqueados para esta partida" }, { status: 403 })
  }

  const points = 0
  const pointBreakdown: Prediction["pointBreakdown"] = { type: "zero", value: 0 }

  const now = new Date().toISOString()
  const prediction: Prediction = {
    id: randomUUID(),
    userId,
    matchId,
    homeGoals,
    awayGoals,
    points,
    pointBreakdown,
    createdAt: now,
    updatedAt: now,
  }

  await upsertPrediction(prediction)
  return NextResponse.json(prediction)
}
