"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, addDoc, Timestamp, where } from "firebase/firestore"
import { canchasData } from "@/lib/canchas-data"
import { labelTipoEscenario } from "@/lib/tipos-escenario"
import { Cancha, ParticipanteReserva } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { CalendarIcon, Upload, CheckCircle2, MapPin, Users, FileText, X, Download, Search, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { generarCartaPrestamo } from "@/lib/carta-prestamo"

export default function ReservasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const fileRef        = useRef<HTMLInputElement>(null)
  const busquedaRef    = useRef<HTMLInputElement>(null)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [escenarios, setEscenarios]         = useState<Cancha[]>([])
  const [loadingData, setLoadingData]       = useState(true)
  // reservas activas para calcular disponibilidad
  const [reservasActivas, setReservasActivas] = useState<{ canchaId: string; fecha: string; horaInicio: string; unidadAsignada?: number }[]>([])

  const [escenarioId, setEscenarioId]   = useState("")
  const [fecha, setFecha]               = useState<Date | undefined>()
  const [horaInicio, setHoraInicio]     = useState("")
  const [unidad, setUnidad]             = useState<number | null>(null)  // solo admin
  const [solicitante, setSolicitante]   = useState("")                   // solo admin
  const [oficio, setOficio]             = useState("")                   // solo admin
  const [pdfFile, setPdfFile]           = useState<File | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [done, setDone]                 = useState(false)

  // Participantes
  const [participantes, setParticipantes]               = useState<ParticipanteReserva[]>([])
  const [busquedaParticipante, setBusquedaParticipante] = useState("")
  const [resultadosBusqueda, setResultadosBusqueda]     = useState<ParticipanteReserva[]>([])
  const [buscandoParticipante, setBuscandoParticipante] = useState(false)
  const [dropdownPos, setDropdownPos]                   = useState<{ top: number; left: number; width: number } | null>(null)

  const esAdmin = usuario?.rol === "admin" || usuario?.rol === "superadmin"

  useEffect(() => {
    if (!authLoading && !usuario) router.replace("/login")
  }, [authLoading, usuario, router])

  useEffect(() => {
    if (!usuario) return
    async function cargar() {
      if (!isFirebaseConfigured || !db) {
        setEscenarios(canchasData.filter(c => c.estado === "disponible"))
        setLoadingData(false)
        return
      }
      try {
        const q = query(collection(db, "escenarios"), orderBy("nombre"))
        const snap = await getDocs(q)
        const lista = snap.empty
          ? canchasData
          : snap.docs.map(d => ({ id: d.id, ...d.data() }) as Cancha)
        setEscenarios(lista.filter(c => c.estado === "disponible"))

        // Cargar reservas activas (pendiente + aprobada) para calcular disponibilidad
        const rq = query(
          collection(db, "reservas"),
          where("estado", "in", ["pendiente", "aprobada"])
        )
        const rsnap = await getDocs(rq)
        setReservasActivas(rsnap.docs.map(d => ({
          canchaId:       d.data().canchaId,
          fecha:          d.data().fecha,
          horaInicio:     d.data().horaInicio,
          unidadAsignada: d.data().unidadAsignada,
        })))
      } catch {
        setEscenarios(canchasData.filter(c => c.estado === "disponible"))
      } finally { setLoadingData(false) }
    }
    cargar()
  }, [usuario])

  const escenarioSel = escenarios.find(e => e.id === escenarioId)

  // Horarios donde TODAS las unidades ya están ocupadas en esa fecha
  function horariosAgotados(esc: Cancha, fechaStr: string): Set<string> {
    const agotados = new Set<string>()
    const cantidad = esc.cantidad ?? 1
    for (const h of esc.horariosDisponibles) {
      const ocupadas = reservasActivas.filter(
        r => r.canchaId === esc.id && r.fecha === fechaStr && r.horaInicio === h
      ).length
      if (ocupadas >= cantidad) agotados.add(h)
    }
    return agotados
  }

  // Para admin: qué unidades están ocupadas en fecha+hora seleccionada
  function unidadesOcupadas(esc: Cancha, fechaStr: string, hora: string): Set<number> {
    const ocupadas = new Set<number>()
    reservasActivas
      .filter(r => r.canchaId === esc.id && r.fecha === fechaStr && r.horaInicio === hora && r.unidadAsignada != null)
      .forEach(r => ocupadas.add(r.unidadAsignada!))
    return ocupadas
  }

  const fechaStr   = fecha ? format(fecha, "yyyy-MM-dd") : ""
  const agotados   = escenarioSel && fechaStr ? horariosAgotados(escenarioSel, fechaStr) : new Set<string>()
  const horarios   = escenarioSel?.horariosDisponibles.filter(h => !agotados.has(h)) ?? []
  const ocupadasU  = escenarioSel && fechaStr && horaInicio ? unidadesOcupadas(escenarioSel, fechaStr, horaInicio) : new Set<number>()
  const totalUnidades = escenarioSel?.cantidad ?? 1

  function calcularHoraFin(inicio: string) {
    const [h, m] = inicio.split(":").map(Number)
    return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  // Recalcula posición del dropdown cada vez que llegan resultados
  useEffect(() => {
    if (resultadosBusqueda.length > 0 && busquedaRef.current) {
      const rect = busquedaRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
    } else {
      setDropdownPos(null)
    }
  }, [resultadosBusqueda])
  const ejecutarBusqueda = useCallback(async (termino: string) => {
    if (!termino.trim() || termino.length < 3) { setResultadosBusqueda([]); return }
    if (!isFirebaseConfigured || !db) {
      console.warn("[busqueda] Firebase no configurado")
      return
    }
    setBuscandoParticipante(true)
    try {
      console.log("[busqueda] Consultando colección 'usuarios'...")
      const snap = await getDocs(collection(db, "usuarios"))
      console.log("[busqueda] Total docs en 'usuarios':", snap.size)
      snap.docs.forEach(d => console.log("[busqueda] doc:", JSON.stringify(d.data())))

      const t = termino.toLowerCase().trim()
      const str = (v: unknown) => (v == null ? "" : String(v).toLowerCase())
      const filtrados = snap.docs
        .map(d => d.data())
        .filter(u => {
          const carnet      = str(u.carnet)
          const codigoEstud = str(u.codigoEstudiantil)
          const nombre      = `${str(u.nombre)} ${str(u.apellido)}`
          const email       = str(u.email)
          const emailLocal  = email.split("@")[0]
          const match = email.includes(t) || emailLocal.includes(t) || carnet.includes(t) || codigoEstud.includes(t) || nombre.includes(t)
          console.log(`[busqueda] "${str(u.nombre)} ${str(u.apellido)}" | email:${email} | carnet:${carnet} | match:${match}`)
          return match
        })
        .slice(0, 8)

      console.log("[busqueda] Filtrados:", filtrados.length)
      setResultadosBusqueda(filtrados.map(u => ({
        uid:      String(u.uid ?? ""),
        nombre:   String(u.nombre ?? ""),
        apellido: String(u.apellido ?? ""),
        email:    String(u.email ?? ""),
        carnet:   String(u.carnet ?? u.codigoEstudiantil ?? ""),
        carrera:  String(u.carrera ?? ""),
        rol:      String(u.rol ?? ""),
      })))
    } catch (err) {
      console.error("[busqueda] Error:", err)
      toast.error("Error al buscar usuarios")
    } finally {
      setBuscandoParticipante(false)
    }
  }, [])

  function buscarParticipante(termino: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!termino.trim() || termino.length < 3) {
      setResultadosBusqueda([])
      return
    }
    debounceRef.current = setTimeout(() => ejecutarBusqueda(termino), 300)
  }

  function agregarParticipante(p: ParticipanteReserva) {
    if (participantes.find(x => x.uid === p.uid)) {
      toast.error("Esta persona ya fue agregada")
      return
    }
    if (usuario && p.uid === usuario.uid) {
      toast.error("No necesitas agregarte a ti mismo")
      return
    }
    setParticipantes(prev => [...prev, p])
    setBusquedaParticipante("")
    setResultadosBusqueda([])
    setDropdownPos(null)
  }

  function quitarParticipante(uid: string) {
    setParticipantes(prev => prev.filter(p => p.uid !== uid))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!escenarioId || !fecha || !horaInicio) {
      toast.error("Completa todos los campos obligatorios")
      return
    }
    if (!esAdmin && !pdfFile) {
      toast.error("Debes adjuntar la carta de préstamo firmada")
      return
    }
    if (esAdmin && !unidad) {
      toast.error("Selecciona la unidad a asignar")
      return
    }
    if (esAdmin && !solicitante.trim()) {
      toast.error("Ingresa el nombre del solicitante")
      return
    }
    if (!usuario) return
    setSubmitting(true)

    try {
      let cartaUrl: string | null = null

      if (pdfFile) {
        const fd = new FormData()
        fd.append("file", pdfFile)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? "Error al subir el archivo")
        }
        const data = await res.json()
        cartaUrl = data.url
      }

      const horaFin = calcularHoraFin(horaInicio)

      const reservaData: Record<string, unknown> = {
        usuarioId:      usuario.uid,
        usuarioNombre:  `${usuario.nombre} ${usuario.apellido}`,
        usuarioEmail:   usuario.email,
        usuarioCarnet:  usuario.carnet ?? usuario.codigoEstudiante ?? "",
        canchaId:       escenarioId,
        canchaNombre:   escenarioSel?.nombre ?? "",
        fecha:          fechaStr,
        horaInicio,
        horaFin,
        // Admin crea directamente aprobada con unidad asignada
        estado:         esAdmin ? "aprobada" : "pendiente",
        cartaFirmada:   cartaUrl,
        createdAt:      Timestamp.now(),
        updatedAt:      Timestamp.now(),
      }

      if (esAdmin && unidad) {
        reservaData.unidadAsignada = unidad
        reservaData.solicitante    = solicitante.trim()
        reservaData.oficio         = oficio.trim()
      }

      if (participantes.length > 0) {
        reservaData.participantes      = participantes
        reservaData.totalParticipantes = participantes.length + 1 // +1 el solicitante
      }

      if (isFirebaseConfigured && db) {
        await addDoc(collection(db, "reservas"), reservaData)
      }

      setDone(true)
      toast.success(esAdmin ? "Reserva creada y aprobada" : "Solicitud enviada correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Error al enviar la solicitud")
    } finally { setSubmitting(false) }
  }

  function resetForm() {
    setEscenarioId(""); setFecha(undefined); setHoraInicio(""); setUnidad(null)
    setSolicitante(""); setOficio(""); setPdfFile(null)
    setParticipantes([]); setBusquedaParticipante(""); setResultadosBusqueda([]); setDropdownPos(null)
  }

  if (authLoading || loadingData) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Spinner size="lg" /></div>
  }
  if (!usuario) return null

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {esAdmin ? "¡Reserva creada!" : "¡Solicitud enviada!"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {esAdmin ? "La reserva fue aprobada directamente." : "Tu solicitud está pendiente de aprobación."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push("/mis-reservas")} className="bg-primary text-primary-foreground">
                Ver mis reservas
              </Button>
              <Button variant="outline" onClick={() => { setDone(false); resetForm() }}>
                {esAdmin ? "Crear otra reserva" : "Hacer otra solicitud"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 py-6 md:py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">
            {esAdmin ? "Crear Reserva" : "Solicitar Préstamo de Escenario"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {esAdmin
              ? "Crea una reserva directa y asigna la unidad específica"
              : "Completa el formulario para solicitar el préstamo"}
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Paso 1: Datos de la reserva */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-primary">
                  {esAdmin ? "Datos de la reserva" : "Paso 1 — Datos de la reserva"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Escenario */}
                <div className="space-y-2">
                  <Label>Escenario deportivo *</Label>
                  <Select value={escenarioId} onValueChange={v => { setEscenarioId(v); setHoraInicio(""); setUnidad(null) }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecciona un escenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {escenarios.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nombre} — {e.ubicacion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {escenarioSel && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{escenarioSel.nombre}</span>
                        <Badge variant="outline" className="text-xs">{labelTipoEscenario(escenarioSel.tipo)}</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{escenarioSel.ubicacion}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{escenarioSel.capacidad} personas</span>
                        <span className="text-xs">{escenarioSel.cantidad ?? 1} unidad{(escenarioSel.cantidad ?? 1) !== 1 ? "es" : ""} disponibles</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fecha */}
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-11 w-full justify-start font-normal", !fecha && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fecha ? format(fecha, "PPP", { locale: es }) : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single" selected={fecha}
                        onSelect={d => { setFecha(d); setHoraInicio(""); setUnidad(null) }}
                        disabled={d => d < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Hora */}
                <div className="space-y-2">
                  <Label>Hora de inicio * (duración: 1 hora)</Label>
                  {!escenarioSel ? (
                    <p className="text-sm text-muted-foreground">Selecciona un escenario primero</p>
                  ) : !fecha ? (
                    <p className="text-sm text-muted-foreground">Selecciona una fecha primero</p>
                  ) : horarios.length === 0 ? (
                    <p className="text-sm text-destructive">No hay horarios disponibles para esta fecha</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {escenarioSel.horariosDisponibles.map(h => {
                        const lleno = agotados.has(h)
                        return (
                          <button key={h} type="button"
                            disabled={lleno}
                            onClick={() => { setHoraInicio(h); setUnidad(null) }}
                            className={cn(
                              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                              lleno
                                ? "bg-muted/40 text-muted-foreground/40 cursor-not-allowed line-through"
                                : horaInicio === h
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}>
                            {h}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {horaInicio && (
                    <p className="text-xs text-muted-foreground">
                      Horario: {horaInicio} – {calcularHoraFin(horaInicio)}
                    </p>
                  )}
                </div>

                {/* Admin: selector de unidad */}
                {esAdmin && escenarioSel && horaInicio && (
                  <div className="space-y-2">
                    <Label>Unidad a asignar *</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: totalUnidades }, (_, i) => i + 1).map(n => {
                        const ocupada = ocupadasU.has(n)
                        return (
                          <button key={n} type="button"
                            disabled={ocupada}
                            onClick={() => setUnidad(n)}
                            className={cn(
                              "rounded-lg px-4 py-2 text-sm font-medium border transition-colors",
                              ocupada
                                ? "border-muted bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                                : unidad === n
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:bg-muted/50"
                            )}>
                            #{n} {ocupada ? "(ocupada)" : ""}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* Admin: campos extra */}
                {esAdmin && (
                  <>
                    <div className="space-y-2">
                      <Label>Nombre del solicitante *</Label>
                      <input
                        type="text"
                        placeholder="Nombre completo de quien solicita"
                        value={solicitante}
                        onChange={e => setSolicitante(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Oficio / Motivo del préstamo</Label>
                      <textarea
                        placeholder="Ej: Torneo interfacultades de fútbol, práctica del equipo representativo..."
                        value={oficio}
                        onChange={e => setOficio(e.target.value)}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Paso 2 (solo estudiante): Descargar carta y subirla */}
            {!esAdmin && (
              <Card className={cn(!escenarioSel || !fecha || !horaInicio ? "opacity-50 pointer-events-none" : "border-primary/20 bg-primary/5")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-primary">Paso 2 — Descarga, firma y sube la carta</CardTitle>
                  <CardDescription>
                    Descarga la carta con tus datos, imprímela, fírmala junto al director y luego súbela aquí.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {escenarioSel && fecha && horaInicio && (
                    <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4 text-sm space-y-1">
                      <p className="font-medium text-secondary mb-2">Datos que irán en tu carta</p>
                      <p><span className="text-muted-foreground">Solicitante:</span> {usuario.nombre} {usuario.apellido}</p>
                      <p><span className="text-muted-foreground">Escenario:</span> {escenarioSel.nombre}</p>
                      <p><span className="text-muted-foreground">Ubicación:</span> {escenarioSel.ubicacion}</p>
                      <p><span className="text-muted-foreground">Fecha:</span> {format(fecha, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                      <p><span className="text-muted-foreground">Horario:</span> {horaInicio} – {calcularHoraFin(horaInicio)}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2 w-full"
                    disabled={!escenarioSel || !fecha || !horaInicio}
                    onClick={() => {
                      if (!escenarioSel || !fecha || !horaInicio || !usuario) return
                      generarCartaPrestamo({
                        nombreCompleto:    `${usuario.nombre} ${usuario.apellido}`,
                        documento:         usuario.carnet ?? usuario.codigoEstudiante ?? "",
                        programaAcademico: usuario.carrera,
                        escenario:         escenarioSel.nombre,
                        ubicacion:         escenarioSel.ubicacion,
                        fecha,
                        horaInicio,
                        horaFin:           calcularHoraFin(horaInicio),
                      })
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Descargar Carta Pre-llenada (PDF)
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Subir carta firmada (solo estudiante) */}
            {!esAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-primary">Sube la carta firmada *</CardTitle>
                  <CardDescription>La carta debe estar firmada por ti y por el director del área.</CardDescription>
                </CardHeader>
                <CardContent>
                  <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden"
                    onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
                  {pdfFile ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium truncate max-w-[220px]">{pdfFile.name}</span>
                        <span className="text-muted-foreground text-xs">({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button type="button" onClick={() => setPdfFile(null)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full h-11" onClick={() => fileRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Adjuntar carta firmada (PDF o imagen)
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Paso participantes: quiénes usarán el escenario */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {esAdmin ? "Participantes del espacio" : "Paso 3 — Personas que usarán el escenario"}
                </CardTitle>
                <CardDescription>
                  Busca por correo, cédula o nombre a las personas que usarán el espacio. Solo aparecen usuarios registrados en el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 overflow-visible">
                {/* Buscador */}
                <div className="space-y-2">
                  <Label>Buscar persona</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={busquedaRef}
                      placeholder="Correo, cédula o nombre..."
                      value={busquedaParticipante}
                      onChange={e => {
                        setBusquedaParticipante(e.target.value)
                        buscarParticipante(e.target.value)
                      }}
                      onBlur={() => setTimeout(() => { setResultadosBusqueda([]); setDropdownPos(null) }, 150)}
                      className="pl-9 h-11"
                    />
                    {buscandoParticipante && (
                      <Spinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {busquedaParticipante.length >= 3 && !buscandoParticipante && resultadosBusqueda.length === 0 && (
                    <p className="text-xs text-muted-foreground pt-1">No se encontraron usuarios con ese criterio.</p>
                  )}
                </div>

                {/* Dropdown via portal — escapa el overflow:hidden del Card */}
                {resultadosBusqueda.length > 0 && busquedaRef.current && (() => {
                  const rect = busquedaRef.current!.getBoundingClientRect()
                  return createPortal(
                    <div
                      style={{
                        position: "fixed",
                        top: rect.bottom + 4,
                        left: rect.left,
                        width: rect.width,
                        zIndex: 9999,
                      }}
                      className="rounded-md border border-border bg-background shadow-xl overflow-hidden"
                    >
                      {resultadosBusqueda.map(p => (
                        <button
                          key={p.uid}
                          type="button"
                          onMouseDown={e => { e.preventDefault(); agregarParticipante(p) }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {p.nombre[0]}{p.apellido[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.nombre} {p.apellido}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.email}{p.carnet ? ` · ${p.carnet}` : ""}</p>
                          </div>
                          <Badge variant="outline" className="ml-auto capitalize text-xs shrink-0">{p.rol}</Badge>
                        </button>
                      ))}
                    </div>,
                    document.body
                  )
                })()}

                {/* Lista de participantes agregados */}
                {participantes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Personas agregadas ({participantes.length})
                    </p>
                    <div className="space-y-2">
                      {participantes.map(p => (
                        <div key={p.uid} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {p.nombre[0]}{p.apellido[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{p.nombre} {p.apellido}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs shrink-0">{p.rol}</Badge>
                          <button
                            type="button"
                            onClick={() => quitarParticipante(p.uid)}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total en el espacio: {participantes.length + 1} persona{participantes.length + 1 !== 1 ? "s" : ""} (incluido el solicitante)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={
                submitting ||
                !escenarioId || !fecha || !horaInicio ||
                (!esAdmin && !pdfFile) ||
                (esAdmin && !unidad)
              }
              className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold"
            >
              {submitting ? <Spinner size="sm" className="mr-2" /> : null}
              {submitting
                ? "Enviando..."
                : esAdmin
                  ? "Crear Reserva"
                  : "Enviar Solicitud de Préstamo"}
            </Button>
          </form>
        </div>
        </div>
      </main>
    </div>
  )
}
