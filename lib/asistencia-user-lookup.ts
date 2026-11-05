import { initializeApp, getApps } from "firebase/app"
import { collection, getDocs, getFirestore, limit, query, where } from "firebase/firestore"
import type { GymUserPublic } from "./gym-user-types"

type AreaConfig = {
  name: string
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
}

const AREAS: AreaConfig[] = [
  {
    name: "asistencia-deporte",
    apiKey: process.env.NEXT_PUBLIC_ASISTENCIA_DEPORTE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_ASISTENCIA_DEPORTE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_ASISTENCIA_DEPORTE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_ASISTENCIA_DEPORTE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_ASISTENCIA_DEPORTE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_ASISTENCIA_DEPORTE_APP_ID,
  },
  {
    name: "asistencia-cultura",
    apiKey: process.env.NEXT_PUBLIC_ASISTENCIA_CULTURA_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_ASISTENCIA_CULTURA_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_ASISTENCIA_CULTURA_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_ASISTENCIA_CULTURA_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_ASISTENCIA_CULTURA_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_ASISTENCIA_CULTURA_APP_ID,
  },
]

function dbFor(area: AreaConfig) {
  if (!area.apiKey || !area.projectId) return null
  const existing = getApps().find((app) => app.name === area.name)
  const app =
    existing ??
    initializeApp(
      {
        apiKey: area.apiKey,
        authDomain: area.authDomain,
        projectId: area.projectId,
        storageBucket: area.storageBucket,
        messagingSenderId: area.messagingSenderId,
        appId: area.appId,
      },
      area.name,
    )
  return getFirestore(app)
}

function mapUser(id: string, data: Record<string, unknown>): GymUserPublic {
  return {
    id,
    nombres: String(data.nombres ?? ""),
    correo: String(data.correo ?? ""),
    numeroDocumento: String(data.numeroDocumento ?? ""),
    codigoEstudiantil: data.codigoEstudiantil ? String(data.codigoEstudiantil) : undefined,
    estamento: String(data.estamento ?? ""),
    facultad: String(data.facultad ?? ""),
    programaAcademico: String(data.programaAcademico ?? ""),
  }
}

async function buscarEnArea(area: AreaConfig, term: string): Promise<GymUserPublic | null> {
  const db = dbFor(area)
  if (!db) return null
  const porDocumento = await getDocs(
    query(collection(db, "user_profiles"), where("numeroDocumento", "==", term), limit(1)),
  )
  if (!porDocumento.empty) {
    const docSnap = porDocumento.docs[0]
    return mapUser(docSnap.id, docSnap.data() as Record<string, unknown>)
  }
  const porCodigo = await getDocs(
    query(collection(db, "user_profiles"), where("codigoEstudiantil", "==", term), limit(1)),
  )
  if (!porCodigo.empty) {
    const docSnap = porCodigo.docs[0]
    return mapUser(docSnap.id, docSnap.data() as Record<string, unknown>)
  }
  return null
}

export async function searchAsistenciaUser(
  term: string,
): Promise<{ found: boolean; user: GymUserPublic | null; error?: string }> {
  const value = term.trim()
  if (!value) {
    return { found: false, user: null, error: "Ingresa la cédula o el código estudiantil." }
  }
  if (!AREAS.some((area) => area.apiKey && area.projectId)) {
    return { found: false, user: null, error: "La base de Asistencias no está configurada." }
  }
  try {
    for (const area of AREAS) {
      const user = await buscarEnArea(area, value)
      if (user) return { found: true, user }
    }
    return { found: false, user: null }
  } catch {
    return { found: false, user: null, error: "Error al buscar en Asistencias." }
  }
}
