import { NextResponse } from "next/server"
import { createDriveAuthUrl } from "@/lib/google-drive"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const origin = new URL(request.url).origin
    const url = createDriveAuthUrl(`${origin}/api/drive/oauth/callback`)
    return NextResponse.redirect(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo iniciar OAuth"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
