import { NextResponse } from "next/server"
import { getMatches, updateMatch, getPredictionsByMatch, upsertPrediction } from "@/lib/db"
import { calculatePoints } from "@/lib/scoring"
import type { Match } from "@/lib/types"

// football-data.org uses slightly different codes for some teams — normalise to our codes
const TLA_MAP: Record<string, string> = {
  SAU: "KSA",
  KSA: "KSA",
  BOS: "BIH",
  CRC: "CRI",
  CON: "COD",
}

function normalise(tla: string): string {
  const upper = tla.toUpperCase()
  return TLA_MAP[upper] ?? upper
}

function mapStatus(apiStatus: string): Match["status"] {
  if (["IN_PLAY", "PAUSED", "HALFTIME", "EXTRA_TIME", "PENALTY"].includes(apiStatus)) return "live"
  if (["FINISHED", "AWARDED"].includes(apiStatus)) return "finished"
  return "scheduled"
}

async function recalcMatch(matchId: string, homeGoals: number, awayGoals: number) {
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

export async function POST() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY não configurada no .env.local" },
      { status: 503 }
    )
  }

  let raw: Response
  try {
    raw = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": apiKey },
      cache: "no-store",
    })
  } catch (err) {
    return NextResponse.json({ error: `Erro de rede: ${err}` }, { status: 502 })
  }

  if (!raw.ok) {
    const body = await raw.text()
    return NextResponse.json({ error: `API retornou ${raw.status}: ${body}` }, { status: 502 })
  }

  const data = await raw.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiMatches: any[] = data.matches ?? []

  const ourMatches = await getMatches()
  const updated: string[] = []
  const unchanged: string[] = []
  const unmatched: string[] = []

  for (const api of apiMatches) {
    const homeCode = normalise(api.homeTeam?.tla ?? "")
    const awayCode = normalise(api.awayTeam?.tla ?? "")
    if (!homeCode || !awayCode) continue

    const match = ourMatches.find(
      (m) => m.homeTeam.code === homeCode && m.awayTeam.code === awayCode
    )

    if (!match) {
      unmatched.push(`${homeCode} × ${awayCode}`)
      continue
    }

    const newStatus = mapStatus(api.status)
    const homeGoals: number | null = api.score?.fullTime?.home ?? null
    const awayGoals: number | null = api.score?.fullTime?.away ?? null

    // Nothing changed — skip
    if (
      newStatus === match.status &&
      homeGoals === match.result.homeGoals &&
      awayGoals === match.result.awayGoals
    ) {
      unchanged.push(match.id)
      continue
    }

    await updateMatch(match.id, {
      status: newStatus,
      result: { homeGoals, awayGoals },
    })

    if (newStatus === "finished" && homeGoals !== null && awayGoals !== null) {
      await recalcMatch(match.id, homeGoals, awayGoals)
    }

    updated.push(
      `${homeCode} ${homeGoals ?? "?"} × ${awayGoals ?? "?"} ${awayCode} → ${newStatus}`
    )
  }

  return NextResponse.json({
    synced: updated.length,
    unchanged: unchanged.length,
    unmatched: unmatched.length,
    details: updated,
    unmatchedList: unmatched,
  })
}
