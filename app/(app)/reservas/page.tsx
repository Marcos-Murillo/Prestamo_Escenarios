"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth, getSolicitanteId, getSolicitanteDisplayName } from "@/lib/auth-context"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, addDoc, Timestamp, where } from "firebase/firestore"
import { canchasData } from "@/lib/canchas-data"
import { labelTipoEscenario } from "@/lib/tipos-escenario"
import { Cancha, ParticipanteReserva } from "@/lib/types"
import { SEDES_ACTIVAS, SEDE_LABELS, type Sede, resolveSede } from "@/lib/sede"
import { requiereCartaFirmada } from "@/lib/sede-rules"
import { searchGymUser } from "@/lib/gym-user-client"
import type { GymUserPublic } from "@/lib/gym-user-types"
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
import { CalendarIcon, Upload, CheckCircle2, MapPin, Users, FileText, X, Download, Search, Trash2, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { generarCartaPrestamo } from "@/lib/carta-prestamo"
import { GymRegisterPrompt } from "@/components/gym-register-prompt"
import { AdminSedeBadge } from "@/components/admin-sede-selector"
import { matchesAdminSede } from "@/lib/auth-context"

function gymUserToParticipante(user: GymUserPublic): ParticipanteReserva {
  return {
    gymUserId: user.id,
    nombres: user.nombres,
    correo: user.correo,
    numeroDocumento: user.numeroDocumento,
    codigoEstudiantil: user.codigoEstudiantil,
    estamento: user.estamento,
    programaAcademico: user.programaAcademico,
  }
}

export default function ReservasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading, isStaff, adminSede } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [sede, setSede] = useState<Sede | "">("")
  const [escenarios, setEscenarios] = useState<Cancha[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [reservasActivas, setReservasActivas] = useState<
    { canchaId: string; fecha: string; horaInicio: string; unidadAsignada?: number; sede?: string }[]
  >([])

  const [escenarioId, setEscenarioId] = useState("")
  const [fecha, setFecha] = useState<Date | undefined>()
  const [horaInicio, setHoraInicio] = useState("")
  const [unidad, setUnidad] = useState<number | null>(null)
  const [solicitanteAdmin, setSolicitanteAdmin] = useState("")
  const [oficio, setOficio] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [participantes, setParticipantes] = useState<ParticipanteReserva[]>([])
  const [busquedaParticipante, setBusquedaParticipante] = useState("")
  const [buscandoParticipante, setBuscandoParticipante] = useState(false)
  const [participanteNoEncontrado, setParticipanteNoEncontrado] = useState(false)

  const esAdmin = isStaff
  const needsSedePicker = !esAdmin || adminSede === "todas"
  const sedeEfectiva = esAdmin && adminSede !== "todas" ? (adminSede as Sede) : sede
  const necesitaCarta = sedeEfectiva ? requiereCartaFirmada(sedeEfectiva as Sede) : false

  useEffect(() => {
    if (esAdmin && adminSede !== "todas") {
      setSede(adminSede as Sede)
    }
  }, [esAdmin, adminSede])

  useEffect(() => {
    if (!authLoading && !usuario) router.replace("/login")
  }, [authLoading, usuario, router])

  useEffect(() => {
    if (!usuario) return
    async function cargar() {
      if (!isFirebaseConfigured || !db) {
        setEscenarios(canchasData.filter((c) => c.estado === "disponible"))
        setLoadingData(false)
        return
      }
      try {
        const q = query(collection(db, "escenarios"), orderBy("nombre"))
        const snap = await getDocs(q)
        const lista = snap.empty
          ? canchasData
          : snap.docs.map((d) => ({ id: d.id, sede: resolveSede(d.data().sede), ...d.data() }) as Cancha)
        setEscenarios(lista.filter((c) => c.estado === "disponible"))

        const rq = query(collection(db, "reservas"), where("estado", "in", ["pendiente", "aprobada"]))
        const rsnap = await getDocs(rq)
        setReservasActivas(
          rsnap.docs.map((d) => ({
            canchaId: d.data().canchaId,
            fecha: d.data().fecha,
            horaInicio: d.data().horaInicio,
            unidadAsignada: d.data().unidadAsignada,
            sede: d.data().sede,
          })),
        )
      } catch {
        setEscenarios(canchasData.filter((c) => c.estado === "disponible"))
      } finally {
        setLoadingData(false)
      }
    }
    cargar()
  }, [usuario])

  const escenariosFiltrados = escenarios.filter((e) => {
    if (!sedeEfectiva) return false
    if (esAdmin && adminSede !== "todas" && !matchesAdminSede(e, adminSede)) return false
    return resolveSede(e.sede) === resolveSede(sedeEfectiva as string)
  })

  const escenarioSel = escenariosFiltrados.find((e) => e.id === escenarioId)

  function reservasEnSedeEscenario(escId: string, fechaStr: string, hora?: string) {
    return reservasActivas.filter(
      (r) =>
        r.canchaId === escId &&
        r.fecha === fechaStr &&
        resolveSede(r.sede) === resolveSede(sedeEfectiva as string) &&
        (hora == null || r.horaInicio === hora),
    )
  }

  function horariosAgotados(esc: Cancha, fechaStr: string): Set<string> {
    const agotados = new Set<string>()
    const cantidad = esc.cantidad ?? 1
    for (const h of esc.horariosDisponibles) {
      if (reservasEnSedeEscenario(esc.id, fechaStr, h).length >= cantidad) agotados.add(h)
    }
    return agotados
  }

  function unidadesOcupadas(esc: Cancha, fechaStr: string, hora: string): Set<number> {
    const ocupadas = new Set<number>()
    reservasEnSedeEscenario(esc.id, fechaStr, hora)
      .filter((r) => r.unidadAsignada != null)
      .forEach((r) => ocupadas.add(r.unidadAsignada!))
    return ocupadas
  }

  const fechaStr = fecha ? format(fecha, "yyyy-MM-dd") : ""
  const agotados = escenarioSel && fechaStr ? horariosAgotados(escenarioSel, fechaStr) : new Set<string>()
  const horarios = escenarioSel?.horariosDisponibles.filter((h) => !agotados.has(h)) ?? []
  const ocupadasU =
    escenarioSel && fechaStr && horaInicio ? unidadesOcupadas(escenarioSel, fechaStr, horaInicio) : new Set<number>()
  const totalUnidades = escenarioSel?.cantidad ?? 1

  function calcularHoraFin(inicio: string) {
    const [h, m] = inicio.split(":").map(Number)
    return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  async function buscarYAgregarParticipante() {
    const termino = busquedaParticipante.trim()
    if (!termino) {
      toast.error("Ingresa la cédula o código estudiantil")
      return
    }

    const solicitanteId = usuario ? getSolicitanteId(usuario) : ""
    setBuscandoParticipante(true)
    setParticipanteNoEncontrado(false)
    try {
      const { found, user, error } = await searchGymUser(termino)
      if (!found || !user) {
        if (error) toast.error(error)
        else setParticipanteNoEncontrado(true)
        return
      }
      if (user.id === solicitanteId) {
        toast.error("Ya eres el solicitante de este préstamo")
        return
      }
      if (participantes.find((p) => p.gymUserId === user.id)) {
        toast.error("Esta persona ya fue agregada")
        return
      }
      setParticipantes((prev) => [...prev, gymUserToParticipante(user)])
      setBusquedaParticipante("")
      setParticipanteNoEncontrado(false)
      toast.success(`${user.nombres} agregado`)
    } catch {
      toast.error("Error al buscar")
    } finally {
      setBuscandoParticipante(false)
    }
  }

  function quitarParticipante(gymUserId: string) {
    setParticipantes((prev) => prev.filter((p) => p.gymUserId !== gymUserId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sedeEfectiva) {
      toast.error("Selecciona la sede")
      return
    }
    if (!escenarioId || !fecha || !horaInicio) {
      toast.error("Completa todos los campos obligatorios")
      return
    }
    if (participantes.length === 0) {
      toast.error("Agrega al menos un participante")
      return
    }
    if (!esAdmin && necesitaCarta && !pdfFile) {
      toast.error("Debes adjuntar la carta de préstamo firmada (Meléndez)")
      return
    }
    if (esAdmin && !unidad) {
      toast.error("Selecciona la unidad a asignar")
      return
    }
    if (esAdmin && !solicitanteAdmin.trim()) {
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
      const gymUserId = getSolicitanteId(usuario)
      const nombreSolicitante = esAdmin ? solicitanteAdmin.trim() : getSolicitanteDisplayName(usuario)

      const reservaData: Record<string, unknown> = {
        sede: sedeEfectiva,
        solicitanteGymUserId: gymUserId,
        solicitanteNumeroDocumento: usuario.numeroDocumento ?? usuario.cedula ?? "",
        usuarioId: gymUserId,
        usuarioNombre: nombreSolicitante,
        usuarioEmail: usuario.correo ?? `${usuario.cedula ?? gymUserId}@prestamos.local`,
        codigoEstudiantil: usuario.codigoEstudiantil,
        canchaId: escenarioId,
        canchaNombre: escenarioSel?.nombre ?? "",
        fecha: fechaStr,
        horaInicio,
        horaFin,
        estado: esAdmin ? "aprobada" : "pendiente",
        cartaFirmada: cartaUrl,
        participantes,
        totalParticipantes: participantes.length + 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      if (esAdmin && unidad) {
        reservaData.unidadAsignada = unidad
        reservaData.solicitante = solicitanteAdmin.trim()
        reservaData.oficio = oficio.trim()
      }

      if (isFirebaseConfigured && db) {
        await addDoc(collection(db, "reservas"), reservaData)
      }

      setDone(true)
      toast.success(esAdmin ? "Reserva creada y aprobada" : "Solicitud enviada correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Error al enviar la solicitud")
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSede("")
    setEscenarioId("")
    setFecha(undefined)
    setHoraInicio("")
    setUnidad(null)
    setSolicitanteAdmin("")
    setOficio("")
    setPdfFile(null)
    setParticipantes([])
    setBusquedaParticipante("")
    setParticipanteNoEncontrado(false)
  }

  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
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
              {!esAdmin && (
                <Button onClick={() => router.push("/mis-reservas")} className="bg-primary text-primary-foreground">
                  Ver mis préstamos
                </Button>
              )}
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
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {esAdmin ? "Crear Reserva" : "Solicitar Préstamo de Escenario"}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {esAdmin
                  ? "Crea una reserva directa y asigna la unidad específica"
                  : "Elige sede, escenario, participantes y confirma tu solicitud"}
              </p>
            </div>
            {esAdmin && <AdminSedeBadge />}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sede */}
            {needsSedePicker && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-primary flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Paso 1 — Sede
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={sede}
                    onValueChange={(v) => {
                      setSede(v as Sede)
                      setEscenarioId("")
                      setHoraInicio("")
                      setUnidad(null)
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecciona la sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEDES_ACTIVAS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SEDE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            <Card className={cn(!sedeEfectiva && !esAdmin && "opacity-50 pointer-events-none")}>
              <CardHeader>
                <CardTitle className="text-base text-primary">
                  {esAdmin ? "Datos de la reserva" : "Paso 2 — Datos de la reserva"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Escenario deportivo *</Label>
                  <Select
                    value={escenarioId}
                    onValueChange={(v) => {
                      setEscenarioId(v)
                      setHoraInicio("")
                      setUnidad(null)
                    }}
                    disabled={!sedeEfectiva}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={sedeEfectiva ? "Selecciona un escenario" : "Elige sede primero"} />
                    </SelectTrigger>
                    <SelectContent>
                      {escenariosFiltrados.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nombre} — {e.ubicacion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {escenariosFiltrados.length === 0 && sedeEfectiva && (
                    <p className="text-sm text-muted-foreground">No hay escenarios disponibles en esta sede.</p>
                  )}
                  {escenarioSel && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{escenarioSel.nombre}</span>
                        <Badge variant="outline" className="text-xs">
                          {labelTipoEscenario(escenarioSel.tipo)}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {escenarioSel.ubicacion}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {escenarioSel.capacidad} personas
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("h-11 w-full justify-start font-normal", !fecha && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fecha ? format(fecha, "PPP", { locale: es }) : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fecha}
                        onSelect={(d) => {
                          setFecha(d)
                          setHoraInicio("")
                          setUnidad(null)
                        }}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

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
                      {escenarioSel.horariosDisponibles.map((h) => {
                        const lleno = agotados.has(h)
                        return (
                          <button
                            key={h}
                            type="button"
                            disabled={lleno}
                            onClick={() => {
                              setHoraInicio(h)
                              setUnidad(null)
                            }}
                            className={cn(
                              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                              lleno
                                ? "bg-muted/40 text-muted-foreground/40 cursor-not-allowed line-through"
                                : horaInicio === h
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80",
                            )}
                          >
                            {h}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {esAdmin && escenarioSel && horaInicio && (
                  <div className="space-y-2">
                    <Label>Unidad a asignar *</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: totalUnidades }, (_, i) => i + 1).map((n) => {
                        const ocupada = ocupadasU.has(n)
                        return (
                          <button
                            key={n}
                            type="button"
                            disabled={ocupada}
                            onClick={() => setUnidad(n)}
                            className={cn(
                              "rounded-lg px-4 py-2 text-sm font-medium border transition-colors",
                              ocupada
                                ? "border-muted bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                                : unidad === n
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:bg-muted/50",
                            )}
                          >
                            #{n} {ocupada ? "(ocupada)" : ""}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {esAdmin && (
                  <>
                    <div className="space-y-2">
                      <Label>Nombre del solicitante *</Label>
                      <input
                        type="text"
                        placeholder="Nombre completo de quien solicita"
                        value={solicitanteAdmin}
                        onChange={(e) => setSolicitanteAdmin(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Oficio / Motivo del préstamo</Label>
                      <textarea
                        placeholder="Ej: Torneo interfacultades..."
                        value={oficio}
                        onChange={(e) => setOficio(e.target.value)}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Participantes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {esAdmin ? "Participantes *" : "Paso 3 — Participantes *"}
                </CardTitle>
                <CardDescription>
                  Busca por cédula o código estudiantil completo en Gym Control. Mínimo un participante además del solicitante.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ingresa tu documento o código"
                      value={busquedaParticipante}
                      onChange={(e) => {
                        setBusquedaParticipante(e.target.value)
                        setParticipanteNoEncontrado(false)
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscarYAgregarParticipante())}
                      className="pl-9 h-11"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 shrink-0"
                    disabled={buscandoParticipante}
                    onClick={buscarYAgregarParticipante}
                  >
                    {buscandoParticipante ? <Spinner size="sm" /> : "Buscar"}
                  </Button>
                </div>

                {participanteNoEncontrado && <GymRegisterPrompt />}
                <GymRegisterPrompt compact />

                {participantes.length > 0 && (
                  <div className="space-y-2">
                    {participantes.map((p) => (
                      <div
                        key={p.gymUserId}
                        className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{p.nombres}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.numeroDocumento}
                            {p.codigoEstudiantil ? ` · ${p.codigoEstudiantil}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarParticipante(p.gymUserId)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Total en el espacio: {participantes.length + 1} personas (incluido el solicitante)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carta Meléndez */}
            {!esAdmin && necesitaCarta && (
              <>
                <Card className={cn(!escenarioSel || !fecha || !horaInicio ? "opacity-50 pointer-events-none" : "border-primary/20 bg-primary/5")}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-primary">Paso 4 — Carta firmada (Meléndez)</CardTitle>
                    <CardDescription>Descarga, firma y sube la carta de préstamo.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {escenarioSel && fecha && horaInicio && (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 w-full"
                        onClick={() => {
                          if (!usuario) return
                          generarCartaPrestamo({
                            nombreCompleto: getSolicitanteDisplayName(usuario),
                            documento: usuario.numeroDocumento ?? usuario.codigoEstudiantil ?? "",
                            programaAcademico: usuario.programaAcademico ?? usuario.facultad ?? "",
                            escenario: escenarioSel.nombre,
                            ubicacion: escenarioSel.ubicacion,
                            fecha,
                            horaInicio,
                            horaFin: calcularHoraFin(horaInicio),
                          })
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Descargar Carta Pre-llenada (PDF)
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-primary">Sube la carta firmada *</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    />
                    {pdfFile ? (
                      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="truncate max-w-[220px]">{pdfFile.name}</span>
                        </div>
                        <button type="button" onClick={() => setPdfFile(null)}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" className="w-full h-11" onClick={() => fileRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Adjuntar carta firmada
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <Button
              type="submit"
              disabled={
                submitting ||
                !sedeEfectiva ||
                !escenarioId ||
                !fecha ||
                !horaInicio ||
                participantes.length === 0 ||
                (!esAdmin && necesitaCarta && !pdfFile) ||
                (esAdmin && !unidad)
              }
              className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold"
            >
              {submitting ? <Spinner size="sm" className="mr-2" /> : null}
              {submitting ? "Enviando..." : esAdmin ? "Crear Reserva" : "Enviar Solicitud de Préstamo"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}