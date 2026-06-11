import { NextRequest, NextResponse } from "next/server"
import { getUserByUsername } from "@/lib/db"

const FIXED_PASSWORD = process.env.FIXED_PASSWORD ?? "1234"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { username, password } = body

  if (!username) {
    return NextResponse.json({ error: "Username obrigatório" }, { status: 400 })
  }

  const user = getUserByUsername(username)
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  if (password !== undefined && password !== FIXED_PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
  }

  if (password === undefined) {
    // First step: just check if user exists
    return NextResponse.json({ exists: true, displayName: user.displayName, username: user.username, description: user.description ?? "" })
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    description: user.description ?? "",
  })
}
