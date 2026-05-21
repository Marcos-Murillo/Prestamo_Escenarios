"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy
} from "firebase/firestore"
import { Cancha } from "@/lib/types"
import { canchasData, getCanchaStripeColor } from "@/lib/canchas-data"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, MapPin, Users } from "lucide-react"

import { TIPOS_ESCENARIO, labelTipoEscenario } from "@/lib/tipos-escenario"
const ESTADOS = ["disponible", "mantenimiento"] as const
const HORARIOS_BASE = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"]

type FormState = {
  nombre: string
  tipo: Cancha["tipo"]
  capacidad: string
  cantidad: string
  ubicacion: string
  estado: "disponible" | "mantenimiento"
  horarios: string[]
}

const EMPTY_FORM: FormState = {
  nombre: "", tipo: "futbol", capacidad: "", cantidad: "1", ubicacion: "", estado: "disponible", horarios: []
}

export default function EscenariosPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [escenarios, setEscenarios] = useState<Cancha[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Cancha | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!usuario) { router.replace("/login"); return }
      if (usuario.rol === "estudiante") { router.replace("/"); return }
    }
  }, [authLoading, usuario, router])

  useEffect(() => {
    if (!usuario || usuario.rol === "estudiante") return
    cargarEscenarios()
  }, [usuario])

  async function cargarEscenarios() {
    setLoading(true)
    if (!isFirebaseConfigured || !db) {
      setEscenarios(canchasData)
      setLoading(false)
      return
    }
    try {
      const q = query(collection(db, "escenarios"), orderBy("nombre"))
      const snap = await getDocs(q)
      if (snap.empty) {
        setEscenarios(canchasData)
      } else {
        setEscenarios(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Cancha))
      }
    } catch { setEscenarios(canchasData) }
    finally { setLoading(false) }
  }

  function abrirCrear() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function abrirEditar(c: Cancha) {
    setEditando(c)
    setForm({
      nombre: c.nombre, tipo: c.tipo,
      capacidad: String(c.capacidad),
      cantidad: String(c.cantidad ?? 1),
      ubicacion: c.ubicacion,
      estado: c.estado === "reservada" ? "disponible" : c.estado,
      horarios: c.horariosDisponibles,
    })
    setDialogOpen(true)
  }

  async function guardar() {
    if (!form.nombre || !form.capacidad || !form.ubicacion) {
      toast.error("Completa todos los campos")
      return
    }
    setSaving(true)
    const data = {
      nombre: form.nombre, tipo: form.tipo,
      capacidad: parseInt(form.capacidad),
      cantidad: parseInt(form.cantidad) || 1,
      ubicacion: form.ubicacion, estado: form.estado,
      horariosDisponibles: form.horarios,
    }
    try {
      if (!isFirebaseConfigured || !db) {
        if (editando) {
          setEscenarios(prev => prev.map(e => e.id === editando.id ? { ...e, ...data } : e))
        } else {
          setEscenarios(prev => [...prev, { id: `local-${Date.now()}`, ...data }])
        }
      } else if (editando) {
        await updateDoc(doc(db, "escenarios", editando.id), data)
        setEscenarios(prev => prev.map(e => e.id === editando.id ? { ...e, ...data } : e))
      } else {
        const ref = await addDoc(collection(db, "escenarios"), data)
        setEscenarios(prev => [...prev, { id: ref.id, ...data }])
      }
      toast.success(editando ? "Escenario actualizado" : "Escenario creado")
      setDialogOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  async function eliminar(id: string) {
    try {
      if (isFirebaseConfigured && db) await deleteDoc(doc(db, "escenarios", id))
      setEscenarios(prev => prev.filter(e => e.id !== id))
      toast.success("Escenario eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDeleteId(null) }
  }

  function toggleHorario(h: string) {
    setForm(prev => ({
      ...prev,
      horarios: prev.horarios.includes(h)
        ? prev.horarios.filter(x => x !== h)
        : [...prev.horarios, h].sort()
    }))
  }

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div className="min-h-screen bg-background pl-20">
      <Sidebar />
      <main className="container px-4 py-8 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Escenarios</h1>
            <p className="mt-1 text-muted-foreground">Gestiona las canchas y espacios deportivos</p>
          </div>
          <Button onClick={abrirCrear} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Escenario
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {escenarios.map(c => (
            <Card key={c.id} className="flex flex-col">
              <div className={`h-1.5 rounded-t-lg ${getCanchaStripeColor(c.tipo)}`} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{c.nombre}</CardTitle>
                  <Badge variant="outline" className="shrink-0">{labelTipoEscenario(c.tipo)}</Badge>
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" />{c.ubicacion}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {c.capacidad} personas
                  </span>
                  <Badge variant="outline" className={c.estado === "disponible"
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-warning/30 bg-warning/10 text-warning-foreground"
                  }>
                    {c.estado}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.horariosDisponibles.length} horarios · {c.cantidad ?? 1} unidad{(c.cantidad ?? 1) !== 1 ? "es" : ""}</p>
                <div className="mt-auto flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => abrirEditar(c)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(c.id)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-primary">{editando ? "Editar Escenario" : "Nuevo Escenario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input placeholder="Cancha de Fútbol A" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v: Cancha["tipo"]) => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_ESCENARIO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidad por unidad</Label>
                <Input type="number" placeholder="22" value={form.capacidad} onChange={e => setForm(p => ({ ...p, capacidad: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cantidad de unidades</Label>
                <Input type="number" min="1" placeholder="1" value={form.cantidad} onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v: "disponible" | "mantenimiento") => setForm(p => ({ ...p, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input placeholder="Zona Deportiva Norte" value={form.ubicacion} onChange={e => setForm(p => ({ ...p, ubicacion: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Horarios disponibles</Label>
              <div className="flex flex-wrap gap-2">
                {HORARIOS_BASE.map(h => (
                  <button key={h} type="button" onClick={() => toggleHorario(h)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${form.horarios.includes(h) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar eliminar */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar escenario?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button className="bg-destructive text-destructive-foreground" onClick={() => deleteId && eliminar(deleteId)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
