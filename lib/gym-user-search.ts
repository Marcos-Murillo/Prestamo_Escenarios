import { getGymCduDb } from "./firebase-gym-cdu-admin"
import type { GymUserProfile } from "./gym-user-types"

const USERS_COLLECTION = "users"

function normalizeAcademicField(value: unknown): string {
  if (value == null) return ""
  const s = String(value).trim()
  if (s === "" || /^n\/a$/i.test(s)) return ""
  return s
}

function normalizeUserDoc(id: string, data: Record<string, unknown>): GymUserProfile {
  return {
    ...(data as Omit<GymUserProfile, "id">),
    id,
    facultad: normalizeAcademicField(data.facultad),
    programaAcademico: normalizeAcademicField(data.programaAcademico),
  }
}

function matchesSearchTerm(user: GymUserProfile, term: string, termLower: string): boolean {
  if (user.numeroDocumento) {
    const docNorm = user.numeroDocumento.trim().toLowerCase()
    if (docNorm === termLower || docNorm.includes(termLower)) return true
  }

  if (user.codigoEstudiantil) {
    const codNorm = user.codigoEstudiantil.trim().toLowerCase()
    if (codNorm === termLower || codNorm.includes(termLower)) return true
  }

  if (user.nombres && user.nombres.toLowerCase().includes(termLower)) {
    return true
  }

  return false
}

/** Consulta indexada por campo (máx. 1 lectura). */
async function queryByField(field: "numeroDocumento" | "codigoEstudiantil", value: string) {
  const db = getGymCduDb()
  const snap = await db
    .collection(USERS_COLLECTION)
    .where(field, "==", value)
    .limit(1)
    .get()
  if (snap.empty) return undefined
  const doc = snap.docs[0]
  return normalizeUserDoc(doc.id, doc.data() as Record<string, unknown>)
}

let usersCache: { data: GymUserProfile[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 10 * 60 * 1000

async function getAllUsersCached(): Promise<GymUserProfile[]> {
  if (usersCache && Date.now() - usersCache.fetchedAt < CACHE_TTL_MS) {
    return usersCache.data
  }
  const db = getGymCduDb()
  const snap = await db.collection(USERS_COLLECTION).get()
  const data = snap.docs.map((d) => normalizeUserDoc(d.id, d.data() as Record<string, unknown>))
  usersCache = { data, fetchedAt: Date.now() }
  return data
}

/**
 * Misma lógica que gym_cdu `searchUserByCode`, optimizada para cuota:
 * 1) consultas exactas indexadas (0–2 lecturas)
 * 2) si no hay match exacto, búsqueda en caché en memoria (máx. 1 full scan / 10 min)
 */
export async function searchGymUserByCode(searchTerm: string): Promise<GymUserProfile | undefined> {
  if (!searchTerm || searchTerm.trim() === "") return undefined

  const term = searchTerm.trim()
  const termLower = term.toLowerCase()

  try {
    const byDoc = await queryByField("numeroDocumento", term)
    if (byDoc?.activo !== false) return byDoc

    const byCod = await queryByField("codigoEstudiantil", term)
    if (byCod?.activo !== false) return byCod

    const allUsers = await getAllUsersCached()
    const foundUser = allUsers.find((user) => {
      if (user.activo === false) return false
      return matchesSearchTerm(user, term, termLower)
    })

    return foundUser
  } catch (error) {
    console.error("Error en searchGymUserByCode:", error)
    return undefined
  }
}
