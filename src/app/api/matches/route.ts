import { NextResponse } from "next/server"
import { getMatches } from "@/lib/db"

export async function GET() {
  const matches = await getMatches()
  return NextResponse.json(matches)
}
