"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { CheckCircle2, ChevronLeft, ChevronRight, Trophy, Loader2 } from "lucide-react"
import Link from "next/link"

// ── Datos de referencia (mismos que gym_cdu) ──────────────────────────────────
const GENEROS = ["MUJER", "HOMBRE", "OTRO"] as const
const GENEROS_LABELS: Record<string, string> = { MUJER: "Femenino", HOMBRE: "Masculino", OTRO: "Otro" }

const TIPOS_DOCUMENTO = [
  "TARJETA DE IDENTIDAD", "CEDULA", "CEDULA DE EXTRANJERIA", "PASAPORTE",
] as const

const ESTAMENTOS = [
  "ESTUDIANTE", "EGRESADO", "DOCENTE", "DOCENTE HORA CATEDRA",
  "FUNCIONARIO", "CONTRATISTA", "INVITADO",
] as const

const FACULTADES = [
  "FACULTAD DE ARTES INTEGRADAS",
  "FACULTAD DE CIENCIAS DE LA ADMINISTRACIÓN",
  "FACULTAD DE CIENCIAS NATURALES Y EXACTAS",
  "FACULTAD DE CIENCIAS SOCIALES Y ECONÓMICO",
  "FACULTAD DE DERECHO Y CIENCIAS POLÍTICAS",
  "FACULTAD DE EDUCACIÓN Y PEDAGOGÍA",
  "FACULTAD DE HUMANIDADES",
  "FACULTAD DE INGENIERÍA",
  "FACULTAD DE PSICOLOGÍA",
  "FACULTAD DE SALUD",
] as const

const PROGRAMAS_POR_FACULTAD: Record<string, string[]> = {
  "FACULTAD DE ARTES INTEGRADAS": ["ARQUITECTURA (3545)","COMUNICACIÓN SOCIAL - PERIODISMO (3553)","MÚSICA (3552)","LICENCIATURA EN ARTES VISUALES (3556)","LICENCIATURA EN DANZA (3560)","DISEÑO GRÁFICO (3551)","DISEÑO INDUSTRIAL (3550)"],
  "FACULTAD DE CIENCIAS DE LA ADMINISTRACIÓN": ["ADMINISTRACIÓN DE EMPRESAS (3845)","ADMINISTRACIÓN TURÍSTICA (3849)","ADMINISTRACIÓN PÚBLICA (3847)","CONTADURÍA PÚBLICA (3841)","FINANZAS Y BANCA (3848)","COMERCIO EXTERIOR (3857)"],
  "FACULTAD DE CIENCIAS NATURALES Y EXACTAS": ["BIOLOGÍA (3140)","FÍSICA (3146)","MATEMÁTICAS (3147)","QUÍMICA (3148)"],
  "FACULTAD DE CIENCIAS SOCIALES Y ECONÓMICO": ["ECONOMÍA (3340)","SOCIOLOGÍA (3350)"],
  "FACULTAD DE DERECHO Y CIENCIAS POLÍTICAS": ["ESTUDIOS POLÍTICOS Y RESOLUCIÓN DE CONFLICTOS (3489)","DERECHO"],
  "FACULTAD DE EDUCACIÓN Y PEDAGOGÍA": ["LICENCIATURA EN MATEMÁTICAS (3492)","LICENCIATURA EN EDUCACIÓN FÍSICA Y DEPORTES (3484)","LICENCIATURA EN EDUCACIÓN INFANTIL (3494)","PROGRAMA ACADÉMICO EN RECREACIÓN (3464)"],
  "FACULTAD DE HUMANIDADES": ["GEOGRAFÍA (3261)","FILOSOFÍA (3260)","HISTORIA (3247)","TRABAJO SOCIAL (3249)","LICENCIATURA EN LENGUAS EXTRANJERAS INGLÉS-FRANCÉS (3267)"],
  "FACULTAD DE INGENIERÍA": ["INGENIERÍA CIVIL (3747)","INGENIERÍA DE SISTEMAS (3743)","INGENIERÍA ELÉCTRICA (3746)","INGENIERÍA ELECTRÓNICA (3744)","INGENIERÍA INDUSTRIAL (3751)","INGENIERÍA MECÁNICA (3748)","INGENIERÍA QUÍMICA (3749)","ESTADÍSTICA (3752)"],
  "FACULTAD DE PSICOLOGÍA": ["PSICOLOGÍA (3461)"],
  "FACULTAD DE SALUD": ["BACTERIOLOGÍA Y LABORATORIO CLÍNICO (3647)","ENFERMERÍA (3645)","FISIOTERAPIA (3646)","MEDICINA Y CIRUGÍA (3660)","ODONTOLOGÍA (3661)","TERAPIA OCUPACIONAL (3651)"],
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
type FormData = {
  nombres: string; correo: string; genero: string; tipoDocumento: string
  numeroDocumento: string; edad: string; telefono: string; estamento: string
  facultad: string; programaAcademico: string; codigoEstudiantil: string
  password: string; confirmPassword: string
}

const EMPTY: FormData = {
  nombres: "", correo: "", genero: "", tipoDocumento: "",
  numeroDocumento: "", edad: "", telefono: "", estamento: "",
  facultad: "", programaAcademico: "", codigoEstudiantil: "",
  password: "", confirmPassword: "",
}

export default function RegistroPage() {
  const router = useRouter()
  const { signUp, usuario, loading: authLoading } = useAuth()

  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState<FormData>(EMPTY)
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const requiresAcademicInfo   = ["ESTUDIANTE","EGRESADO","DOCENTE"].includes(form.estamento)
  const requiresCodigo         = ["ESTUDIANTE","EGRESADO"].includes(form.estamento)
  const totalSteps             = requiresAcademicInfo ? 4 : 3  // +1 para contraseña

  useEffect(() => {
    if (!authLoading && usuario) router.replace("/reservas")
  }, [authLoading, usuario, router])

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === "facultad") next.programaAcademico = ""
      if (field === "estamento") {
        if (!["ESTUDIANTE","EGRESADO","DOCENTE"].includes(value)) {
          next.facultad = ""; next.programaAcademico = ""
        }
        if (!["ESTUDIANTE","EGRESADO"].includes(value)) next.codigoEstudiantil = ""
      }
      return next
    })

  function validateStep(s: number): boolean {
    setError("")
    switch (s) {
      case 1:
        if (!form.nombres || !form.correo || !form.genero || !form.tipoDocumento || !form.numeroDocumento || !form.edad || !form.telefono) {
          setError("Por favor completa todos los campos requeridos"); return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
          setError("Ingresa un correo electrónico válido"); return false
        }
        return true
      case 2:
        if (!form.estamento) { setError("Por favor completa todos los campos requeridos"); return false }
        return true
      case 3:
        if (requiresAcademicInfo) {
          if (!form.facultad || !form.programaAcademico) { setError("Por favor completa todos los campos requeridos"); return false }
          if (requiresCodigo && form.codigoEstudiantil.length !== 9) { setError("El código estudiantil debe tener exactamente 9 dígitos"); return false }
        }
        return true
      case 4:
        if (!form.password || form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return false }
        if (form.password !== form.confirmPassword) { setError("Las contraseñas no coinciden"); return false }
        return true
      default: return true
    }
  }

  const next = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, totalSteps)) }
  const prev = () => { setError(""); setStep(s => Math.max(s - 1, 1)) }

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) return
    setLoading(true)
    try {
      await signUp(form.correo, form.password, {
        nombre:  form.nombres.split(" ")[0] ?? form.nombres,
        apellido: form.nombres.split(" ").slice(1).join(" ") || "-",
        carnet:  form.codigoEstudiantil || form.numeroDocumento,
        carrera: form.programaAcademico || form.estamento,
        telefono: form.telefono,
        // campos extra
        ...(form.codigoEstudiantil ? { codigoEstudiantil: form.codigoEstudiantil } : {}),
      })
      setDone(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      if (msg.includes("email-already-in-use")) setError("Ya existe un usuario registrado con este correo")
      else setError("Error al guardar el usuario. Por favor intenta de nuevo.")
    } finally { setLoading(false) }
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Gracias por registrarte</h2>
                <p className="text-muted-foreground text-lg">Ahora puedes reservar escenarios deportivos</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Tu código de acceso es:{" "}
                <span className="font-mono font-bold text-primary">
                  {form.codigoEstudiantil || form.numeroDocumento}
                </span>
              </p>
              <Button onClick={() => router.push("/reservas")} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Ir a reservar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />

      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl text-primary">Registro de Usuario</CardTitle>
              <CardDescription>Paso {step} de {totalSteps}</CardDescription>
            </div>
          </div>
          {/* Barra de progreso */}
          <div className="flex gap-2 pt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ── Paso 1: Información Personal ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres y Apellidos *</Label>
                  <Input id="nombres" value={form.nombres} onChange={e => set("nombres", e.target.value)} placeholder="Ingresa tu nombre completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo Institucional *</Label>
                  <Input id="correo" type="email" value={form.correo} onChange={e => set("correo", e.target.value)} placeholder="correo@ejemplo.com" />
                  {form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo) && (
                    <p className="text-xs text-destructive">Ingresa un correo electrónico válido</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Género *</Label>
                  <Select value={form.genero} onValueChange={v => set("genero", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona tu género" /></SelectTrigger>
                    <SelectContent>
                      {GENEROS.map(g => <SelectItem key={g} value={g}>{GENEROS_LABELS[g]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edad">Edad *</Label>
                  <Input id="edad" type="number" value={form.edad} onChange={e => set("edad", e.target.value)} placeholder="Tu edad" min="1" max="120" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento *</Label>
                  <Select value={form.tipoDocumento} onValueChange={v => set("tipoDocumento", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona tipo de documento" /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroDocumento">Número de Documento *</Label>
                  <Input id="numeroDocumento" value={form.numeroDocumento} onChange={e => set("numeroDocumento", e.target.value)} placeholder="Número de documento" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono / Celular *</Label>
                <Input id="telefono" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="Número de teléfono" />
              </div>
            </div>
          )}

          {/* ── Paso 2: Información Institucional ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Información Institucional</h3>
              <div className="space-y-2">
                <Label>Estamento *</Label>
                <Select value={form.estamento} onValueChange={v => set("estamento", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona tu estamento" /></SelectTrigger>
                  <SelectContent>
                    {ESTAMENTOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Paso 3: Información Académica (condicional) ── */}
          {step === 3 && requiresAcademicInfo && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Información Académica</h3>
              {requiresCodigo && (
                <div className="space-y-2">
                  <Label htmlFor="codigoEstudiantil">Código Estudiantil * (9 dígitos, ej: 202625413)</Label>
                  <Input
                    id="codigoEstudiantil"
                    value={form.codigoEstudiantil}
                    onChange={e => set("codigoEstudiantil", e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="202625413" maxLength={9} inputMode="numeric"
                  />
                  {form.codigoEstudiantil && form.codigoEstudiantil.length !== 9 && (
                    <p className="text-xs text-destructive">El código debe tener exactamente 9 dígitos</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>Facultad *</Label>
                <Select key={`facultad-${form.estamento}`} value={form.facultad} onValueChange={v => set("facultad", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona tu facultad" /></SelectTrigger>
                  <SelectContent>
                    {FACULTADES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.facultad && (
                <div className="space-y-2">
                  <Label>Programa Académico *</Label>
                  <Select key={`programa-${form.facultad}`} value={form.programaAcademico} onValueChange={v => set("programaAcademico", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona tu programa" /></SelectTrigger>
                    <SelectContent>
                      {(PROGRAMAS_POR_FACULTAD[form.facultad] ?? []).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* ── Último paso: Contraseña ── */}
          {step === totalSteps && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Crear Contraseña</h3>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña * (mínimo 6 caracteres)</Label>
                <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
                )}
              </div>
            </div>
          )}

          {/* ── Navegación ── */}
          <div className="flex justify-between pt-4">
            {step > 1
              ? <Button variant="outline" onClick={prev}><ChevronLeft className="h-4 w-4 mr-2" />Anterior</Button>
              : <div />
            }
            {step < totalSteps
              ? <Button onClick={next} className="bg-primary text-primary-foreground">Siguiente<ChevronRight className="h-4 w-4 ml-2" /></Button>
              : <Button onClick={handleSubmit} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {loading ? "Guardando..." : "Completar Registro"}
                </Button>
            }
          </div>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-secondary hover:underline">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
