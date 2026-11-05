import Link from "next/link"
import { ASISTENCIA_LOCAL_URL } from "@/lib/asistencia-url"

export function LocalPrestamosHome() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Escenarios en local</h1>
        <p className="text-sm text-muted-foreground">
          Esta copia no te saca hacia Asistencias. El enlace de producción queda solo para el sitio publicado.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/conectar-drive" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Conectar Drive
          </Link>
          <Link href="/admin" className="rounded-md border border-border px-4 py-2 text-sm">
            Panel de administración
          </Link>
          <a href={ASISTENCIA_LOCAL_URL} className="rounded-md border border-border px-4 py-2 text-sm">
            Asistencias en localhost:3001
          </a>
        </div>
      </div>
    </div>
  )
}
