"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { obtenerTodasReservas } from "@/lib/reservas-service"
import { Reserva } from "@/lib/types"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Calendar, CheckCircle, XCircle, Clock, BarChart3, Trophy } from "lucide-react"

export default function EstadisticasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!usuario) { router.replace("/login"); return }
      if (usuario.rol === "estudiante") { router.replace("/"); return }
    }
  }, [authLoading, usuario, router])

  useEffect(() => {
    if (!usuario || usuario.rol === "estudiante") return
    obtenerTodasReservas().then(setReservas).finally(() => setLoading(false))
  }, [usuario])

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>
  }

  const total      = reservas.length
  const aprobadas  = reservas.filter(r => r.estado === "aprobada").length
  const pendientes = reservas.filter(r => r.estado === "pendiente").length
  const rechazadas = reservas.filter(r => r.estado === "rechazada").length
  const canceladas = reservas.filter(r => r.estado === "cancelada").length

  // Reservas por cancha
  const porCancha = reservas.reduce<Record<string, number>>((acc, r) => {
    acc[r.canchaNombre] = (acc[r.canchaNombre] ?? 0) + 1
    return acc
  }, {})
  const canchaRanking = Object.entries(porCancha).sort((a, b) => b[1] - a[1])

  // Reservas por día (últimos 7 días)
  const hoy = new Date()
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - (6 - i))
    return d.toISOString().split("T")[0]
  })
  const porDia = ultimos7.map(fecha => ({
    fecha,
    count: reservas.filter(r => r.fecha === fecha).length,
    label: new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
  }))
  const maxDia = Math.max(...porDia.map(d => d.count), 1)

  const kpis = [
    { label: "Total reservas",  value: total,      icon: Calendar,     color: "text-primary",     bg: "bg-primary/10" },
    { label: "Aprobadas",       value: aprobadas,  icon: CheckCircle,  color: "text-success",     bg: "bg-success/10" },
    { label: "Pendientes",      value: pendientes, icon: Clock,        color: "text-warning",     bg: "bg-warning/10" },
    { label: "Rechazadas",      value: rechazadas, icon: XCircle,      color: "text-destructive", bg: "bg-destructive/10" },
  ]

  return (
    <div className="min-h-screen bg-background pl-20">
      <Sidebar />
      <main className="container px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Estadísticas</h1>
          <p className="mt-1 text-muted-foreground">Resumen de préstamos y reservas de escenarios</p>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Actividad últimos 7 días */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <BarChart3 className="h-5 w-5" /> Actividad últimos 7 días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {porDia.map(({ fecha, count, label }) => (
                  <div key={fecha} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium text-foreground">{count > 0 ? count : ""}</span>
                    <div
                      className="w-full rounded-t-md bg-primary transition-all"
                      style={{ height: `${(count / maxDia) * 100}%`, minHeight: count > 0 ? "4px" : "2px", opacity: count > 0 ? 1 : 0.2 }}
                    />
                    <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking canchas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Trophy className="h-5 w-5" /> Canchas más reservadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canchaRanking.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin datos aún</p>
              ) : (
                <div className="space-y-3">
                  {canchaRanking.slice(0, 6).map(([nombre, count], i) => (
                    <div key={nombre} className="flex items-center gap-3">
                      <span className="w-5 text-sm font-bold text-muted-foreground">{i + 1}</span>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{nombre}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-secondary"
                            style={{ width: `${(count / (canchaRanking[0]?.[1] ?? 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribución por estado */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-primary">Distribución por estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: "Aprobadas",  count: aprobadas,  pct: total ? Math.round(aprobadas/total*100) : 0,  color: "bg-success" },
                  { label: "Pendientes", count: pendientes, pct: total ? Math.round(pendientes/total*100) : 0, color: "bg-warning" },
                  { label: "Rechazadas", count: rechazadas, pct: total ? Math.round(rechazadas/total*100) : 0, color: "bg-destructive" },
                  { label: "Canceladas", count: canceladas, pct: total ? Math.round(canceladas/total*100) : 0, color: "bg-muted-foreground" },
                ].map(({ label, count, pct, color }) => (
                  <div key={label} className="rounded-lg border border-border p-4 text-center">
                    <div className={`mx-auto mb-2 h-2 w-16 rounded-full ${color}`} />
                    <p className="text-2xl font-bold text-foreground">{pct}%</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{count} reservas</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
