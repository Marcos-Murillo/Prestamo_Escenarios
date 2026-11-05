import { NextResponse } from "next/server"
import { getOAuth2Client, saveRefreshToken } from "@/lib/google-drive"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const oauthError = url.searchParams.get("error")

  if (oauthError) return htmlResponse(`Google denegó el acceso (${oauthError}).`, false)
  if (!code) return htmlResponse("Falta el código de autorización.", false)

  try {
    const oauth = getOAuth2Client(`${url.origin}/api/drive/oauth/callback`)
    const { tokens } = await oauth.getToken(code)
    if (!tokens.refresh_token) {
      return htmlResponse(
        "Google no envió un permiso nuevo. Quítalo en tu cuenta de Google y vuelve a conectar.",
        false,
      )
    }
    saveRefreshToken(tokens.refresh_token)
    return htmlResponse("El Drive de Préstamos quedó conectado. Ya puedes cerrar esta pestaña y enviar la carta.", true)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al autorizar Drive"
    return htmlResponse(message, false)
  }
}

function htmlResponse(message: string, ok: boolean) {
  const html = `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>Drive de Préstamos</title></head>
  <body style="font-family:sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem">
    <h1 style="color:${ok ? "#166534" : "#991b1b"}">${ok ? "Listo" : "No se pudo conectar"}</h1>
    <p>${message}</p>
    <p><a href="/conectar-drive">Volver</a></p>
  </body>
</html>`
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
