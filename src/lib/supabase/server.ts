import { createClient } from "@supabase/supabase-js"

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL
  if (!url) throw new Error("SUPABASE_URL is not set")
  return url
}

function getJwtRole(key: string): string | undefined {
  const parts = key.split(".")
  if (parts.length < 2) return undefined
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as {
      role?: string
    }
    return payload.role
  } catch {
    return undefined
  }
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")

  const role = getJwtRole(key)
  if (role && role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY has role "${role}" — use the service_role secret from Supabase Dashboard → Project Settings → API (not the anon/publishable key)`
    )
  }

  return key
}

export function createServerClient() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
