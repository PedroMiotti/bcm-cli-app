import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import { calculatePoints } from "../src/lib/scoring"

config({ path: resolve(process.cwd(), ".env.local") })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

async function main() {
  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select("id, result")
    .eq("status", "finished")

  if (matchErr) throw new Error(`fetch matches: ${matchErr.message}`)
  if (!matches?.length) {
    console.log("No finished matches found.")
    return
  }

  const finishedIds = matches.map((m) => m.id)

  const { data: predictions, error: predErr } = await supabase
    .from("predictions")
    .select("id, match_id, home_goals, away_goals")
    .in("match_id", finishedIds)

  if (predErr) throw new Error(`fetch predictions: ${predErr.message}`)
  if (!predictions?.length) {
    console.log("No predictions to update.")
    return
  }

  const resultByMatch = new Map(
    matches.map((m) => [m.id, m.result as { homeGoals: number; awayGoals: number }])
  )

  let updated = 0
  for (const pred of predictions) {
    const result = resultByMatch.get(pred.match_id)
    if (!result || result.homeGoals == null || result.awayGoals == null) continue

    const breakdown = calculatePoints(pred.home_goals, pred.away_goals, result.homeGoals, result.awayGoals)

    const { error } = await supabase
      .from("predictions")
      .update({ points: breakdown.value, point_breakdown: breakdown })
      .eq("id", pred.id)

    if (error) {
      console.error(`Failed to update prediction ${pred.id}: ${error.message}`)
    } else {
      updated++
    }
  }

  console.log(`Done. Updated ${updated} / ${predictions.length} predictions.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
