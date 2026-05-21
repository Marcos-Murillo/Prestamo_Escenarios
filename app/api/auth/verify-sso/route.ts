import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const SSO_SECRET = process.env.SSO_SECRET!

function mapRole(role: string): "estudiante" | "admin" | "superadmin" {
  const r = role?.toLowerCase() ?? ""
  if (r === "superadmin" || r === "super_admin") return "superadmin"
  if (r === "admin") return "admin"
  return "admin"
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: "Token requerido." }, { status: 400 })
    }

    const payload = jwt.verify(token, SSO_SECRET) as {
      uid: string
      nombre: string
      cedula: string
      role?: string
      rol?: string
      platform?: string
    }

    const rol = mapRole(payload.rol ?? payload.role ?? "admin")

    return NextResponse.json({
      uid: payload.cedula ?? payload.uid,
      nombre: payload.nombre,
      cedula: payload.cedula ?? payload.uid,
      rol,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("expired")) {
      return NextResponse.json(
        { error: "El enlace ha expirado. Vuelve a intentarlo desde CampusFlow." },
        { status: 401 },
      )
    }
    return NextResponse.json({ error: "Token inválido." }, { status: 401 })
  }
}
