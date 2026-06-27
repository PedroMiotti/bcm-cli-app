import { NextRequest, NextResponse } from "next/server"
import { getUsers, getPredictions, getMatches } from "@/lib/db"
import type { RankingEntry } from "@/lib/types"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")

  const [allMatches, allPredictions] = await Promise.all([getMatches(), getPredictions()])
  const users = getUsers()

  const grupoMatches = allMatches.filter((m) => m.phase === "grupo" && m.status === "finished")
  const grupoMatchIds = new Set(grupoMatches.map((m) => m.id))
  const grupoMatchMap = new Map(grupoMatches.map((m) => [m.id, m]))

  const grupoPredictions = allPredictions.filter((p) => grupoMatchIds.has(p.matchId))

  // Ranking for grupo phase
  const ranking: RankingEntry[] = users.map((user) => {
    const userPreds = grupoPredictions.filter((p) => p.userId === user.id)
    const breakdown = { exact: 0, winnerPlusGoals: 0, winner: 0, oneTeamGoals: 0 }
    let totalPoints = 0

    for (const p of userPreds) {
      totalPoints += p.points
      if (p.pointBreakdown.type === "exact") breakdown.exact++
      else if (p.pointBreakdown.type === "winner_plus_goals") breakdown.winnerPlusGoals++
      else if (p.pointBreakdown.type === "winner") breakdown.winner++
      else if (p.pointBreakdown.type === "one_team_goals") breakdown.oneTeamGoals++
    }

    return { userId: user.id, username: user.username, displayName: user.displayName, totalPoints, breakdown, position: 0 }
  })

  ranking.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.breakdown.exact !== a.breakdown.exact) return b.breakdown.exact - a.breakdown.exact
    return b.breakdown.winnerPlusGoals - a.breakdown.winnerPlusGoals
  })
  ranking.forEach((e, i) => { e.position = i + 1 })

  const mvp = ranking[0] ?? null
  const exactKing = [...ranking].sort((a, b) => b.breakdown.exact - a.breakdown.exact)[0] ?? null

  // Per-user accuracy and avg pts (only users who made at least one prediction)
  const userAccuracy = users
    .map((user) => {
      const preds = grupoPredictions.filter((p) => p.userId === user.id)
      if (preds.length === 0) return null
      const accurate = preds.filter((p) => p.points > 0).length
      const accuracy = Math.round((accurate / preds.length) * 100)
      const avgPts = parseFloat((preds.reduce((s, p) => s + p.points, 0) / preds.length).toFixed(1))
      return { userId: user.id, displayName: user.displayName, accuracy, avgPts }
    })
    .filter(Boolean) as { userId: string; displayName: string; accuracy: number; avgPts: number }[]

  const accuracyKing = userAccuracy.length > 0
    ? [...userAccuracy].sort((a, b) => b.accuracy - a.accuracy || b.avgPts - a.avgPts)[0]
    : null
  const avgKing = userAccuracy.length > 0
    ? [...userAccuracy].sort((a, b) => b.avgPts - a.avgPts || b.accuracy - a.accuracy)[0]
    : null

  // Per-match prediction map
  const matchPredMap = new Map<string, typeof grupoPredictions>()
  for (const pred of grupoPredictions) {
    if (!matchPredMap.has(pred.matchId)) matchPredMap.set(pred.matchId, [])
    matchPredMap.get(pred.matchId)!.push(pred)
  }

  // Match highlights
  let mostExactMatch = null
  let hardestMatch = null

  for (const [matchId, preds] of matchPredMap.entries()) {
    const match = grupoMatchMap.get(matchId)
    if (!match || match.result.homeGoals === null) continue

    const exactCount = preds.filter((p) => p.pointBreakdown.type === "exact").length
    const zeroCount = preds.filter((p) => p.points === 0).length
    const result = `${match.result.homeGoals}-${match.result.awayGoals}`
    const teamInfo = { homeTeam: match.homeTeam, awayTeam: match.awayTeam, result }

    if (!mostExactMatch || exactCount > mostExactMatch.exactCount) {
      mostExactMatch = { ...teamInfo, exactCount }
    }
    if (!hardestMatch || zeroCount > hardestMatch.zeroCount) {
      hardestMatch = { ...teamInfo, zeroCount, playerCount: preds.length }
    }
  }

  // Most predicted scoreline across all grupo predictions
  const scoreCounts: Record<string, number> = {}
  for (const p of grupoPredictions) {
    const key = `${p.homeGoals}-${p.awayGoals}`
    scoreCounts[key] = (scoreCounts[key] ?? 0) + 1
  }
  const mostPredictedScore = Object.entries(scoreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const totalExact = grupoPredictions.filter((p) => p.pointBreakdown.type === "exact").length
  const totalGroupPoints = grupoPredictions.reduce((s, p) => s + p.points, 0)
  const denominator = grupoMatches.length * (ranking.length || 1)
  const avgPts = denominator > 0 ? parseFloat((totalGroupPoints / denominator).toFixed(1)) : 0

  // Personal stats
  let myStats = null
  if (userId) {
    const myPreds = grupoPredictions.filter((p) => p.userId === userId)
    const myRankEntry = ranking.find((r) => r.userId === userId)
    const accurate = myPreds.filter((p) => p.points > 0)
    const accuracy = myPreds.length > 0 ? Math.round((accurate.length / myPreds.length) * 100) : 0
    const myExact = myPreds.filter((p) => p.pointBreakdown.type === "exact").length
    const myTotalPoints = myPreds.reduce((s, p) => s + p.points, 0)
    const myAvgPts = myPreds.length > 0 ? parseFloat((myTotalPoints / myPreds.length).toFixed(1)) : 0
    const myMissed = myPreds.filter((p) => p.points === 0).length

    const bestPred = [...myPreds].sort((a, b) => b.points - a.points)[0]
    const bestMatch = bestPred ? grupoMatchMap.get(bestPred.matchId) : null

    const myScoreCounts: Record<string, number> = {}
    for (const p of myPreds) {
      const key = `${p.homeGoals}-${p.awayGoals}`
      myScoreCounts[key] = (myScoreCounts[key] ?? 0) + 1
    }
    const myMostPredicted = Object.entries(myScoreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const pos = myRankEntry?.position ?? 0
    const n = ranking.length
    const beatPercent = n > 1 ? Math.round(((n - pos) / (n - 1)) * 100) : 0

    myStats = {
      totalPoints: myTotalPoints,
      position: pos,
      accuracy,
      exactCount: myExact,
      avgPts: myAvgPts,
      totalMissed: myMissed,
      beatPercent,
      bestGame: bestPred && bestMatch
        ? { homeTeam: bestMatch.homeTeam, awayTeam: bestMatch.awayTeam, points: bestPred.points, type: bestPred.pointBreakdown.type }
        : null,
      myMostPredicted,
    }
  }

  return NextResponse.json({
    totalMatches: grupoMatches.length,
    totalPredictions: grupoPredictions.length,
    totalExact,
    avgPts,
    ranking,
    mvp: mvp ? { userId: mvp.userId, displayName: mvp.displayName, totalPoints: mvp.totalPoints } : null,
    exactKing: exactKing ? { userId: exactKing.userId, displayName: exactKing.displayName, exactCount: exactKing.breakdown.exact } : null,
    accuracyKing: accuracyKing ? { userId: accuracyKing.userId, displayName: accuracyKing.displayName, accuracy: accuracyKing.accuracy } : null,
    avgKing: avgKing ? { userId: avgKing.userId, displayName: avgKing.displayName, avgPts: avgKing.avgPts } : null,
    mostExactMatch,
    hardestMatch,
    mostPredictedScore,
    myStats,
  })
}
