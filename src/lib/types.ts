export interface User {
  id: string
  username: string
  displayName: string
  role: "admin" | "participant"
  description?: string
}

export interface Team {
  name: string
  code: string
  flag: string
}

export interface MatchResult {
  homeGoals: number | null
  awayGoals: number | null
}

export interface Match {
  id: string
  group: string
  matchNumber: number
  homeTeam: Team
  awayTeam: Team
  stadium: string
  scheduledAt: string
  status: "scheduled" | "live" | "finished"
  result: MatchResult
}

export type PointType = "exact" | "winner_plus_goals" | "winner" | "one_team_goals" | "zero"

export interface PointBreakdown {
  type: PointType
  value: number
}

export interface Prediction {
  id: string
  userId: string
  matchId: string
  homeGoals: number
  awayGoals: number
  points: number
  pointBreakdown: PointBreakdown
  createdAt: string
  updatedAt: string
}

export interface RankingEntry {
  userId: string
  username: string
  displayName: string
  totalPoints: number
  breakdown: {
    exact: number
    winnerPlusGoals: number
    winner: number
    oneTeamGoals: number
  }
  position: number
}

export interface SessionUser {
  id: string
  username: string
  displayName: string
  role: string
  description?: string
}
