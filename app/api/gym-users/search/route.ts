import { NextRequest, NextResponse } from "next/server"
import { lookupGymUser } from "@/lib/gym-user-lookup"
import { toGymUserPublic } from "@/lib/gym-user-types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 40
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    gymProjectId: process.env.NEXT_PUBLIC_GYM_FIREBASE_PROJECT_ID ?? "espacioscdu",
  })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiadas búsquedas. Intenta en un momento." }, { status: 429 })
  }

  try {
    const { term } = await req.json()
    if (!term || typeof term !== "string" || !term.trim()) {
      return NextResponse.json({ error: "Ingresa tu cédula o código estudiantil." }, { status: 400 })
    }

    const user = await lookupGymUser(term)
    if (!user) {
      return NextResponse.json({ found: false, user: null })
    }
    if (!user.activo) {
      return NextResponse.json({
        found: false,
        user: null,
        error: "Tu usuario no está activo en Gym Control. Contacta al personal del CDU.",
      })
    }

    return NextResponse.json({ found: true, user: toGymUserPublic(user) })
  } catch (error) {
    console.error("[gym-users/search]", error)
    return NextResponse.json({ error: "Error al buscar usuario." }, { status: 500 })
  }
}
