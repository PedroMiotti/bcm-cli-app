import fs from "fs"
import path from "path"
import { createServerClient } from "./supabase/server"
import type { User, Match, Prediction, Team, MatchResult, PointBreakdown, MatchPhase } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")

function readJSON<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename)
  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as T
}

interface MatchRow {
  id: string
  group: string
  phase: MatchPhase
  match_number: number
  home_team: Team
  away_team: Team
  stadium: string
  scheduled_at: string
  status: Match["status"]
  result: MatchResult
}

interface PredictionRow {
  id: string
  user_id: string
  match_id: string
  home_goals: number
  away_goals: number
  points: number
  point_breakdown: PointBreakdown
  created_at: string
  updated_at: string
}

function rowToMatch(row: MatchRow): Match {
  return {
    id: row.id,
    group: row.group,
    phase: row.phase ?? "grupo",
    matchNumber: row.match_number,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    stadium: row.stadium,
    scheduledAt: row.scheduled_at,
    status: row.status,
    result: row.result,
  }
}

function matchToRow(match: Match): MatchRow {
  return {
    id: match.id,
    group: match.group,
    phase: match.phase,
    match_number: match.matchNumber,
    home_team: match.homeTeam,
    away_team: match.awayTeam,
    stadium: match.stadium,
    scheduled_at: match.scheduledAt,
    status: match.status,
    result: match.result,
  }
}

function rowToPrediction(row: PredictionRow): Prediction {
  return {
    id: row.id,
    userId: row.user_id,
    matchId: row.match_id,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    points: row.points,
    pointBreakdown: row.point_breakdown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function predictionToRow(prediction: Prediction): PredictionRow {
  return {
    id: prediction.id,
    user_id: prediction.userId,
    match_id: prediction.matchId,
    home_goals: prediction.homeGoals,
    away_goals: prediction.awayGoals,
    points: prediction.points,
    point_breakdown: prediction.pointBreakdown,
    created_at: prediction.createdAt,
    updated_at: prediction.updatedAt,
  }
}

export function getUsers(): User[] {
  return readJSON<User[]>("users.json")
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase())
}

export async function getMatches(): Promise<Match[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_number", { ascending: true })

  if (error) throw new Error(`getMatches: ${error.message}`)
  return (data as MatchRow[]).map(rowToMatch)
}

export async function getMatch(id: string): Promise<Match | undefined> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("matches").select("*").eq("id", id).maybeSingle()

  if (error) throw new Error(`getMatch: ${error.message}`)
  if (!data) return undefined
  return rowToMatch(data as MatchRow)
}

export async function updateMatch(id: string, updates: Partial<Match>): Promise<void> {
  const existing = await getMatch(id)
  if (!existing) return

  const merged = { ...existing, ...updates }
  const row: Partial<MatchRow> = {}
  if (updates.group !== undefined) row.group = merged.group
  if (updates.phase !== undefined) row.phase = merged.phase
  if (updates.matchNumber !== undefined) row.match_number = merged.matchNumber
  if (updates.homeTeam !== undefined) row.home_team = merged.homeTeam
  if (updates.awayTeam !== undefined) row.away_team = merged.awayTeam
  if (updates.stadium !== undefined) row.stadium = merged.stadium
  if (updates.scheduledAt !== undefined) row.scheduled_at = merged.scheduledAt
  if (updates.status !== undefined) row.status = merged.status
  if (updates.result !== undefined) row.result = merged.result

  const supabase = createServerClient()
  const { error } = await supabase.from("matches").update(row).eq("id", id)

  if (error) throw new Error(`updateMatch: ${error.message}`)
}

export async function getPredictions(): Promise<Prediction[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("predictions").select("*").limit(10000)

  if (error) throw new Error(`getPredictions: ${error.message}`)
  return (data as PredictionRow[]).map(rowToPrediction)
}

export async function getPredictionsByUser(userId: string): Promise<Prediction[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("predictions").select("*").eq("user_id", userId)

  if (error) throw new Error(`getPredictionsByUser: ${error.message}`)
  return (data as PredictionRow[]).map(rowToPrediction)
}

export async function getPredictionsByMatch(matchId: string): Promise<Prediction[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("predictions").select("*").eq("match_id", matchId)

  if (error) throw new Error(`getPredictionsByMatch: ${error.message}`)
  return (data as PredictionRow[]).map(rowToPrediction)
}

export async function upsertPrediction(prediction: Prediction): Promise<void> {
  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from("predictions")
    .select("id")
    .eq("user_id", prediction.userId)
    .eq("match_id", prediction.matchId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("predictions")
      .update({
        home_goals: prediction.homeGoals,
        away_goals: prediction.awayGoals,
        points: prediction.points,
        point_breakdown: prediction.pointBreakdown,
        updated_at: prediction.updatedAt,
      })
      .eq("id", existing.id)
    if (error) throw new Error(`upsertPrediction: ${error.message}`)
  } else {
    const row = predictionToRow({ ...prediction, createdAt: new Date().toISOString() })
    const { error } = await supabase.from("predictions").insert(row)
    if (error) throw new Error(`upsertPrediction: ${error.message}`)
  }
}

export { matchToRow, predictionToRow }
