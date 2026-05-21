"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { Reserva } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin, User, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO
} from "date-fns"
import { es } from "date-fns/locale"

const ESTADO_COLOR: Record<string, string> = {
  aprobada:   "bg-success text-success-foreground",
  pendiente:  "bg-warning text-warning-foreground",
  rechazada:  "bg-destructive text-destructive-foreground",
  cancelada:  "bg-muted text-muted-foreground",
  completada: "bg-primary text-primary-foreground",
}

export default function CalendarioPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [reservas, setReservas]     = useState<Reserva[]>([])
  const [loading, setLoading]       = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selected, setSelected]     = useState<Reserva | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!usuario) { router.replace("/login"); return }
      if (usuario.rol === "estudiante") { router.replace("/mis-reservas"); return }
    }
  }, [authLoading, usuario, router])

  useEffect(() => {
    if (!usuario || usuario.rol === "estudiante") return
    async function cargar() {
      if (!isFirebaseConfigured || !db) { setLoading(false); return }
      try {
        const q = query(collection(db, "reservas"), orderBy("fecha"))
        const snap = await getDocs(q)
        setReservas(snap.docs.map(d => ({
          id: d.id, ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
          updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
        }) as Reserva))
      } catch { /* sin datos */ }
      finally { setLoading(false) }
    }
    cargar()
  }, [usuario])

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>
  }

  // Construir grilla del mes
  const monthStart  = startOfMonth(currentDate)
  const monthEnd    = endOfMonth(currentDate)
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd      = endOfWeek(monthEnd,   { weekStartsOn: 1 })

  const days: Date[] = []
  let d = calStart
  while (d <= calEnd) { days.push(d); d = addDays(d, 1) }

  const reservasPorDia = (day: Date) =>
    reservas.filter(r => {
      try { return isSameDay(parseISO(r.fecha), day) } catch { return false }
    })

  const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  return (
    <div className="container px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">
          {format(currentDate, "MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        {Object.entries(ESTADO_COLOR).map(([estado, cls]) => (
          <span key={estado} className={cn("rounded-full px-2 py-0.5 font-medium capitalize", cls)}>
            {estado}
          </span>
        ))}
      </div>

      {/* Grilla */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 border-b border-border">
          {DIAS.map(dia => (
            <div key={dia} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {dia}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const reservasDia = reservasPorDia(day)
            const esHoy       = isToday(day)
            const esMes       = isSameMonth(day, currentDate)

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] border-b border-r border-border p-1.5 transition-colors",
                  !esMes && "bg-muted/30",
                  idx % 7 === 6 && "border-r-0",
                  idx >= days.length - 7 && "border-b-0"
                )}
              >
                {/* Número del día */}
                <div className="mb-1 flex justify-end">
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    esHoy ? "bg-primary text-primary-foreground" : esMes ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>

                {/* Eventos */}
                <div className="space-y-0.5">
                  {reservasDia.slice(0, 3).map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className={cn(
                        "w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium transition-opacity hover:opacity-80",
                        ESTADO_COLOR[r.estado] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {r.horaInicio} {r.canchaNombre}
                    </button>
                  ))}
                  {reservasDia.length > 3 && (
                    <p className="px-1 text-xs text-muted-foreground">
                      +{reservasDia.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Panel detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Estado badge */}
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", ESTADO_COLOR[selected.estado])}>
              {selected.estado}
            </span>

            <h2 className="mt-3 text-lg font-bold text-foreground">{selected.canchaNombre}</h2>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-primary" />
                <span>{selected.usuarioNombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>{selected.canchaNombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {new Date(selected.fecha + "T12:00:00").toLocaleDateString("es-ES", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                  })}
                  {" · "}{selected.horaInicio} – {selected.horaFin}
                </span>
              </div>
              {selected.estado === "aprobada" && (
                <div className="rounded-lg bg-success/10 px-3 py-2 text-success text-xs font-medium">
                  Aprobada el {selected.updatedAt
                    ? new Date(selected.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </div>
              )}
              {selected.motivoRechazo && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-xs">
                  Motivo: {selected.motivoRechazo}
                </div>
              )}
            </div>

            <Button className="mt-5 w-full" variant="outline" onClick={() => setSelected(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
