import "dotenv/config"
import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import type { Match, Prediction } from "../src/lib/types"
import { matchToRow, predictionToRow } from "../src/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const value = trimmed.slice(eq + 1)
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function seed() {
  const matches = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "matches.json"), "utf-8")
  ) as Match[]
  const predictions = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "predictions.json"), "utf-8")
  ) as Prediction[]

  const matchRows = matches.map(matchToRow)
  const { error: matchesError } = await supabase.from("matches").upsert(matchRows, {
    onConflict: "id",
  })
  if (matchesError) {
    console.error("Failed to seed matches:", matchesError.message)
    process.exit(1)
  }
  console.log(`Seeded ${matchRows.length} matches`)

  const predictionRows = predictions.map(predictionToRow)
  const { error: predictionsError } = await supabase.from("predictions").upsert(predictionRows, {
    onConflict: "user_id,match_id",
  })
  if (predictionsError) {
    console.error("Failed to seed predictions:", predictionsError.message)
    process.exit(1)
  }
  console.log(`Seeded ${predictionRows.length} predictions`)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
