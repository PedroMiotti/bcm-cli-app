import { NextRequest, NextResponse } from "next/server"
import { getMatches } from "@/lib/db"

export async function GET(request: NextRequest) {
  const phase = request.nextUrl.searchParams.get("phase")
  const matches = await getMatches()
  const filtered = phase ? matches.filter((m) => m.phase === phase) : matches
  return NextResponse.json(filtered)
}
