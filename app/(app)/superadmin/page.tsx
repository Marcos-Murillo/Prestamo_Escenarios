"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { auth, db, isFirebaseConfigured } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore"
import { Usuario } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  Shield, Users, LayoutDashboard, Calendar, ClipboardList,
  UserPlus, Eye, EyeOff, ExternalLink, LogOut
} from "lucide-react"

const NAV_LINKS = [
  { href: "/",           label: "Inicio",         icon: LayoutDashboard },
  { href: "/reservas",   label: "Reservar Cancha", icon: Calendar },
  { href: "/mis-reservas", label: "Mis Reservas",  icon: ClipboardList },
  { href: "/admin",      label: "Panel Admin",     icon: Shield },
  { href: "/perfil",     label: "Perfil",          icon: Users },
]

export default function SuperAdminPage() {
  const router = useRouter()
  const { usuario, loading: authLoading, signOut } = useAuth()

  const [admins, setAdmins]       = useState<Usuario[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)

  // Form crear admin
  const [email, setEmail]         = useState("")
  const [nombre, setNombre]       = useState("")
  const [apellido, setApellido]   = useState("")
  const [password, setPassword]   = useState("")
  const [showPass, setShowPass]   = useState(false)
  const [creating, setCreating]   = useState(false)

  // Guard: solo superadmin
  useEffect(() => {
    if (!authLoading) {
      if (!usuario) { router.replace("/login"); return }
      if (usuario.rol !== "superadmin") { router.replace("/"); return }
    }
  }, [authLoading, usuario, router])

  // Cargar admins existentes
  useEffect(() => {
    if (!usuario || usuario.rol !== "superadmin") return
    async function cargar() {
      if (!isFirebaseConfigured || !db) { setLoadingAdmins(false); return }
      try {
        const q = query(collection(db, "usuarios"), where("rol", "in", ["admin", "superadmin"]))
        const snap = await getDocs(q)
        setAdmins(snap.docs.map(d => d.data() as Usuario))
      } catch { /* sin datos */ }
      finally { setLoadingAdmins(false) }
    }
    cargar()
  }, [usuario])

  const handleCrearAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !nombre || !apellido || !password) {
      toast.error("Completa todos los campos")
      return
    }
    if (!isFirebaseConfigured || !auth || !db) {
      toast.error("Firebase no configurado")
      return
    }
    setCreating(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      const nuevoAdmin: Usuario = {
        uid: user.uid, email,
        nombre, apellido,
        carnet: email,
        carrera: "Administración",
        rol: "admin",
        createdAt: new Date(),
      }
      await setDoc(doc(db, "usuarios", user.uid), nuevoAdmin)
      setAdmins(prev => [...prev, nuevoAdmin])
      toast.success(`Admin ${nombre} ${apellido} creado`)
      setEmail(""); setNombre(""); setApellido(""); setPassword("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      if (msg.includes("email-already-in-use")) {
        toast.error("Ese carnet ya tiene una cuenta")
      } else {
        toast.error("Error al crear admin")
      }
    } finally {
      setCreating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!usuario || usuario.rol !== "superadmin") return null

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5" />
            Super Admin
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-white/10"
            onClick={() => { signOut(); router.replace("/login") }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Columna izquierda */}
          <div className="space-y-6 lg:col-span-1">

            {/* Navegación rápida */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <LayoutDashboard className="h-5 w-5" />
                  Navegar
                </CardTitle>
                <CardDescription>Acceso rápido a todas las páginas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-secondary" />
                      {label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Info sesión */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-primary">Sesión activa</p>
                <p className="mt-1 text-sm text-muted-foreground">{usuario.nombre} {usuario.apellido}</p>
                <Badge className="mt-2 bg-primary text-primary-foreground">superadmin</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha */}
          <div className="space-y-6 lg:col-span-2">

            {/* Crear admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <UserPlus className="h-5 w-5" />
                  Crear Administrador
                </CardTitle>
                <CardDescription>
                  El admin podrá gestionar reservas desde el panel de administración
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCrearAdmin} className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" placeholder="admin@ejemplo.com" value={email}
                      onChange={e => setEmail(e.target.value)} disabled={creating} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" placeholder="Juan" value={nombre}
                      onChange={e => setNombre(e.target.value)} disabled={creating} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input id="apellido" placeholder="Pérez" value={apellido}
                      onChange={e => setApellido(e.target.value)} disabled={creating} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass">Contraseña</Label>
                    <div className="relative">
                      <Input id="pass" type={showPass ? "text" : "password"}
                        placeholder="••••••••" value={password}
                        onChange={e => setPassword(e.target.value)} disabled={creating}
                        className="pr-10" />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="toggle password">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={creating}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      {creating ? <Spinner size="sm" className="mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      {creating ? "Creando..." : "Crear Administrador"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Lista de admins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  Administradores ({admins.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmins ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : admins.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No hay administradores registrados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {admins.map(admin => (
                      <div key={admin.uid}
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {admin.nombre} {admin.apellido}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Carnet: {admin.carnet ?? "—"}
                          </p>
                        </div>
                        <Badge
                          className={admin.rol === "superadmin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                          }>
                          {admin.rol}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}
