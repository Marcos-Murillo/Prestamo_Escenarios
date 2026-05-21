"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, doc, updateDoc, Timestamp, where } from "firebase/firestore"
import { Reserva, Cancha } from "@/lib/types"
import { canchasData } from "@/lib/canchas-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  CheckCircle, XCircle, Clock, Calendar, User,
  Hash, FileText, Search, Download, PanelRightClose
} from "lucide-react"
import { cn } from "@/lib/utils"

const ESTADO_CONFIG = {
  pendiente:  { label: "Pendiente",  color: "border-warning/30 bg-warning/10 text-warning-foreground",  icon: Clock },
  aprobada:   { label: "Aprobada",   color: "border-success/30 bg-success/10 text-success",             icon: CheckCircle },
  rechazada:  { label: "Rechazada",  color: "border-destructive/30 bg-destructive/10 text-destructive", icon: XCircle },
  cancelada:  { label: "Cancelada",  color: "border-muted/30 bg-muted text-muted-foreground",           icon: XCircle },
  completada: { label: "Completada", color: "border-primary/30 bg-primary/10 text-primary",             icon: CheckCircle },
} as const

export default function PeticionesPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()

  const [reservas, setReservas]         = useState<Reserva[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [filtroEstado, setFiltroEstado] = useState("all")
  const [pdfUrl, setPdfUrl]             = useState<string | null>(null)
  const [pdfNombre, setPdfNombre]       = useState("")
  const [escenarios, setEscenarios]     = useState<Cancha[]>([])

  // Dialog aprobar/rechazar
  const [selected, setSelected]   = useState<Reserva | null>(null)
  const [accion, setAccion]       = useState<"aprobar" | "rechazar" | null>(null)
  const [motivo, setMotivo]       = useState("")
  const [unidadSel, setUnidadSel] = useState<number | null>(null)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!usuario) { router.replace("/login"); return }
      if (usuario.rol === "estudiante") { router.replace("/"); return }
    }
  }, [authLoading, usuario, router])

  useEffect(() => {
    if (!usuario || usuario.rol === "estudiante") return
    cargar()
  }, [usuario])

  async function cargar() {
    setLoading(true)
    if (!isFirebaseConfigured || !db) { setLoading(false); return }
    try {
      const q = query(collection(db, "reservas"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)
      setReservas(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      }) as Reserva))

      // Cargar escenarios para saber cuántas unidades tiene cada uno
      const eq = query(collection(db, "escenarios"), orderBy("nombre"))
      const esnap = await getDocs(eq)
      setEscenarios(esnap.empty
        ? canchasData
        : esnap.docs.map(d => ({ id: d.id, ...d.data() }) as Cancha)
      )
    } catch { toast.error("Error al cargar peticiones") }
    finally { setLoading(false) }
  }

  async function confirmarAccion() {
    if (!selected || !accion) return
    if (accion === "rechazar" && !motivo.trim()) { toast.error("Escribe el motivo del rechazo"); return }
    if (accion === "aprobar" && !unidadSel) { toast.error("Selecciona la unidad a asignar"); return }
    setSaving(true)
    const nuevoEstado = accion === "aprobar" ? "aprobada" : "rechazada"
    try {
      if (isFirebaseConfigured && db) {
        const updateData: Record<string, unknown> = {
          estado: nuevoEstado,
          motivoRechazo: accion === "rechazar" ? motivo : null,
          updatedAt: Timestamp.now(),
        }
        if (accion === "aprobar" && unidadSel) {
          updateData.unidadAsignada = unidadSel
        }
        await updateDoc(doc(db, "reservas", selected.id), updateData)
      }
      setReservas(prev => prev.map(r =>
        r.id === selected.id
          ? { ...r, estado: nuevoEstado, motivoRechazo: motivo || undefined, unidadAsignada: unidadSel ?? undefined }
          : r
      ))
      toast.success(accion === "aprobar" ? "Reserva aprobada" : "Reserva rechazada")
      cerrarDialog()
    } catch { toast.error("Error al actualizar") }
    finally { setSaving(false) }
  }

  function cerrarDialog() {
    setSelected(null); setAccion(null); setMotivo(""); setUnidadSel(null)
  }

  // Unidades ya asignadas para la misma cancha/fecha/hora (excluyendo la reserva actual)
  function unidadesOcupadas(r: Reserva): Set<number> {
    const ocupadas = new Set<number>()
    reservas
      .filter(x =>
        x.id !== r.id &&
        x.canchaId === r.canchaId &&
        x.fecha === r.fecha &&
        x.horaInicio === r.horaInicio &&
        (x.estado === "aprobada") &&
        x.unidadAsignada != null
      )
      .forEach(x => ocupadas.add(x.unidadAsignada!))
    return ocupadas
  }

  function abrirDoc(url: string, nombre: string) {
    setPdfUrl(url)
    setPdfNombre(nombre)
  }

  const reservasFiltradas = reservas.filter(r => {
    const matchSearch =
      r.usuarioNombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.usuarioCarnet ?? "").includes(search) ||
      r.canchaNombre.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filtroEstado === "all" || r.estado === filtroEstado)
  })

  const pendientes = reservas.filter(r => r.estado === "pendiente").length

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div className="flex h-screen gap-3 overflow-hidden bg-background p-3">

      {/* ── Columna izquierda: lista ── */}
      <div className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300",
        pdfUrl ? "w-1/2" : "w-full"
      )}>
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Peticiones</h1>
              <p className="text-sm text-muted-foreground">Solicitudes de reserva de escenarios</p>
            </div>
            {pendientes > 0 && (
              <Badge className="bg-warning text-warning-foreground">{pendientes} pendiente{pendientes !== 1 ? "s" : ""}</Badge>
            )}
          </div>

          {/* Filtros */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="aprobada">Aprobadas</SelectItem>
                <SelectItem value="rechazada">Rechazadas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          {reservasFiltradas.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Calendar className="mx-auto h-10 w-10 mb-3" />
              <p>No hay peticiones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reservasFiltradas.map(r => {
                const cfg  = ESTADO_CONFIG[r.estado]
                const Icon = cfg.icon
                const fecha = new Date(r.fecha + "T12:00:00").toLocaleDateString("es-ES", {
                  day: "numeric", month: "short", year: "numeric"
                })
                const cartaUrl = (r as any).cartaFirmada ?? r.comprobantePDF

                return (
                  <Card key={r.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-3 px-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground truncate">{r.canchaNombre}</span>
                            <Badge variant="outline" className={cn("gap-1 text-xs shrink-0", cfg.color)}>
                              <Icon className="h-3 w-3" />{cfg.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.usuarioNombre}</span>
                            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{r.usuarioCarnet ?? "—"}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fecha}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.horaInicio}–{r.horaFin}</span>
                            {r.unidadAsignada && (
                              <span className="font-medium text-primary">Unidad #{r.unidadAsignada}</span>
                            )}
                          </div>
                          {r.estado === "rechazada" && r.motivoRechazo && (
                            <p className="text-xs text-destructive">Motivo: {r.motivoRechazo}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Ver carta */}
                        {cartaUrl && (
                          <Button
                            size="sm" variant="outline"
                            className={cn("h-7 text-xs gap-1", pdfUrl === cartaUrl && "border-primary text-primary")}
                            onClick={() => pdfUrl === cartaUrl ? setPdfUrl(null) : abrirDoc(cartaUrl, r.usuarioNombre)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {pdfUrl === cartaUrl ? "Cerrar doc" : "Ver carta"}
                          </Button>
                        )}

                        {/* Aprobar / Rechazar */}
                        {r.estado === "pendiente" && (
                          <>
                            <Button size="sm" className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                              onClick={() => { setSelected(r); setAccion("aprobar") }}>
                              <CheckCircle className="mr-1 h-3.5 w-3.5" /> Aprobar
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => { setSelected(r); setAccion("rechazar") }}>
                              <XCircle className="mr-1 h-3.5 w-3.5" /> Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Columna derecha: visor PDF ── */}
      {pdfUrl && (
        <div className="flex w-1/2 flex-col p-4 gap-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <span className="truncate text-sm font-medium text-foreground max-w-[200px]">
              {pdfNombre}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1 text-xs rounded-lg" asChild>
                <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-3.5 w-3.5" /> Descargar
                </a>
              </Button>
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs rounded-lg" onClick={() => setPdfUrl(null)}>
                <PanelRightClose className="h-4 w-4" /> Replegar
              </Button>
            </div>
          </div>

          {/* Iframe del documento */}
          <div className="flex-1 overflow-hidden rounded-xl border border-border shadow-md bg-white">
            {pdfUrl.includes("drive.google.com") ? (
              <iframe
                src={pdfUrl.replace("/view", "/preview")}
                className="h-full w-full border-0 rounded-xl"
                allow="autoplay"
                title="Carta firmada"
              />
            ) : (
              <iframe
                src={pdfUrl}
                className="h-full w-full border-0 rounded-xl"
                title="Carta firmada"
              />
            )}
          </div>
        </div>
      )}

      {/* Dialog confirmar */}
      <Dialog open={!!selected} onOpenChange={() => cerrarDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={accion === "aprobar" ? "text-success" : "text-destructive"}>
              {accion === "aprobar" ? "Aprobar reserva" : "Rechazar reserva"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Escenario:</span> {selected.canchaNombre}</p>
              <p><span className="font-medium text-foreground">Estudiante:</span> {selected.usuarioNombre}</p>
              <p><span className="font-medium text-foreground">Fecha:</span> {selected.fecha} · {selected.horaInicio}–{selected.horaFin}</p>
            </div>
          )}
          {accion === "aprobar" && selected && (() => {
            const esc = escenarios.find(e => e.id === selected.canchaId)
            const total = esc?.cantidad ?? 1
            const ocupadas = unidadesOcupadas(selected)
            return (
              <div className="space-y-2">
                <Label>Asignar unidad *</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: total }, (_, i) => i + 1).map(n => {
                    const ocupada = ocupadas.has(n)
                    return (
                      <button key={n} type="button"
                        disabled={ocupada}
                        onClick={() => setUnidadSel(n)}
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm font-medium border transition-colors",
                          ocupada
                            ? "border-muted bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                            : unidadSel === n
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:bg-muted/50"
                        )}>
                        #{n} {ocupada ? "(ocupada)" : ""}
                      </button>
                    )
                  })}
                </div>
                {total === 1 && !unidadSel && (
                  <p className="text-xs text-muted-foreground">Solo hay 1 unidad disponible</p>
                )}
              </div>
            )
          })()}
          {accion === "rechazar" && (
            <div className="space-y-2">
              <Label>Motivo del rechazo *</Label>
              <Textarea placeholder="Explica el motivo..." value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={cerrarDialog}>Cancelar</Button>
            <Button onClick={confirmarAccion} disabled={saving}
              className={accion === "aprobar" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {accion === "aprobar" ? "Confirmar aprobación" : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
