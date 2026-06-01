import { NextRequest, NextResponse } from "next/server"
import { isGymCduConfigured } from "@/lib/firebase-gym-cdu-admin"
import { searchGymUserByCode } from "@/lib/gym-user-search"
import { toGymUserPublic } from "@/lib/gym-user-types"

/** firebase-admin requiere Node.js (no Edge). */
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

/** Comprobar que la ruta existe: GET /api/gym-users/search */
export async function GET() {
  return NextResponse.json({
    ok: true,
    gymConfigured: isGymCduConfigured(),
  })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiadas búsquedas. Intenta en un momento." }, { status: 429 })
  }

  if (!isGymCduConfigured()) {
    return NextResponse.json(
      { error: "Búsqueda de usuarios no configurada. Contacta al administrador." },
      { status: 503 },
    )
  }

  try {
    const { term } = await req.json()
    if (!term || typeof term !== "string" || term.trim().length < 4) {
      return NextResponse.json(
        { error: "Ingresa la cédula completa o el código estudiantil completo." },
        { status: 400 },
      )
    }

    const user = await searchGymUserByCode(term.trim())
    if (!user) {
      return NextResponse.json({ found: false, user: null })
    }

    return NextResponse.json({ found: true, user: toGymUserPublic(user) })
  } catch (error) {
    console.error("[gym-users/search]", error)
    return NextResponse.json({ error: "Error al buscar usuario." }, { status: 500 })
  }
}
