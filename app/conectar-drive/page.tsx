"use client"

import { useEffect, useState } from "react"

type DriveStatus = "ok" | "missing" | "invalid"

export default function ConectarDrivePrestamosPage() {
  const [status, setStatus] = useState<DriveStatus | null>(null)
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  const redirectUri = `${origin}/api/drive/oauth/callback`

  useEffect(() => {
    fetch("/api/drive/oauth/status")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.reason === "ok" || payload.reason === "invalid" || payload.reason === "missing") {
          setStatus(payload.reason)
          return
        }
        setStatus(payload.ready ? "ok" : "missing")
      })
      .catch(() => setStatus("missing"))
  }, [])

  return (
    <main className="mx-auto min-h-screen max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Conectar Drive de Préstamos</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Usa el cliente <strong>PrestamosAdmin</strong> y el Gmail dueño de la carpeta de escenarios. No uses el Drive de
        Asistencias.
      </p>

      {status === "ok" ? (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Drive de Préstamos conectado.</p>
      ) : status === "invalid" ? (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          El permiso venció o fue revocado. Quítalo en tu cuenta de Google y vuelve a conectar.
        </p>
      ) : (
        <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
          En <strong>PrestamosAdmin</strong>, el origen de JavaScript es <code>{origin}</code> y la URL de
          redirección es <code className="break-all">{redirectUri}</code>.
        </p>
      )}

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
        <li>En el .env.local de Préstamos van el ID y el secreto de PrestamosAdmin, y la carpeta original.</li>
        <li>Reinicia esta app y pulsa Conectar con Google.</li>
        <li>Acepta el permiso con la cuenta dueña de esa carpeta.</li>
      </ol>

      <a href="/api/drive/oauth/start" className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
        Conectar con Google
      </a>
    </main>
  )
}
