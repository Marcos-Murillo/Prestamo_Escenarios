"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db, isFirebaseConfigured } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { Usuario } from "@/lib/types"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Search, User, Hash, GraduationCap, Mail } from "lucide-react"

export default function UsuariosPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")

  useEffect(() => {
    if (!authLoading) {
      if (!usuario) { router.replace("/login"); return }
      if (usuario.rol === "estudiante") { router.replace("/"); return }
    }
  }, [authLoading, usuario, router])

  useEffect(() => {
    if (!usuario || usuario.rol === "estudiante") return
    async function cargar() {
      if (!isFirebaseConfigured || !db) { setLoading(false); return }
      try {
        const q = query(collection(db, "usuarios"), orderBy("nombre"))
        const snap = await getDocs(q)
        setUsuarios(snap.docs.map(d => d.data() as Usuario))
      } catch { toast.error("Error al cargar usuarios") }
      finally { setLoading(false) }
    }
    cargar()
  }, [usuario])

  const filtrados = usuarios.filter(u => {
    const s = search.toLowerCase()
    return (
      u.nombre.toLowerCase().includes(s) ||
      u.apellido.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.carnet ?? "").includes(s)
    )
  })

  const ROL_BADGE: Record<string, string> = {
    estudiante:  "bg-secondary/10 text-secondary border-secondary/30",
    admin:       "bg-primary/10 text-primary border-primary/30",
    superadmin:  "bg-accent/10 text-accent border-accent/30",
  }

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div className="min-h-screen bg-background pl-20">
      <Sidebar />
      <main className="container px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Usuarios</h1>
          <p className="mt-1 text-muted-foreground">
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrados
          </p>
        </div>

        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, carnet o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map(u => (
              <Card key={u.uid} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          {u.nombre} {u.apellido}
                        </CardTitle>
                        <Badge variant="outline" className={`mt-1 text-xs capitalize ${ROL_BADGE[u.rol] ?? ""}`}>
                          {u.rol}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  {(u.carnet ?? u.codigoEstudiante) && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 shrink-0" />
                      <span>{u.carnet ?? u.codigoEstudiante}</span>
                    </div>
                  )}
                  {u.carrera && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{u.carrera}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
