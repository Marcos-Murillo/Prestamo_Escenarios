import type { QueryDocumentSnapshot } from "firebase-admin/firestore"
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

/** Solo dígitos (cédula). */
function normalizeDocument(value: string): string {
  return value.replace(/\D/g, "").trim()
}

/** Código estudiantil: trim, mayúsculas, sin espacios. */
function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "")
}

async function queryByField(
  field: string,
  value: string,
): Promise<QueryDocumentSnapshot[]> {
  if (!value) return []
  const snap = await getGymCduDb()
    .collection(USERS_COLLECTION)
    .where(field, "==", value)
    .limit(5)
    .get()
  return snap.docs
}

/**
 * Varias consultas indexadas (==); sin leer toda la colección.
 * Mismo patrón que cdr-landing lookupGym / stock San Fernando.
 */
async function queryByAnyEquality(
  queries: { field: string; value: string }[],
): Promise<QueryDocumentSnapshot[]> {
  const seen = new Set<string>()
  const results: QueryDocumentSnapshot[] = []

  for (const { field, value } of queries) {
    if (!value) continue
    const docs = await queryByField(field, value)
    for (const doc of docs) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id)
        results.push(doc)
      }
    }
  }

  return results
}

function buildLookupQueries(raw: string): { field: string; value: string }[] {
  const queries: { field: string; value: string }[] = []
  const docNorm = normalizeDocument(raw)
  const codeNorm = normalizeCode(raw)

  if (docNorm.length >= 6) {
    queries.push({ field: "numeroDocumento", value: docNorm })
    if (raw.trim() !== docNorm) {
      queries.push({ field: "numeroDocumento", value: raw.trim() })
    }
  }

  if (codeNorm.length >= 4) {
    queries.push({ field: "codigoEstudiantil", value: codeNorm })
    const rawTrim = raw.trim()
    if (rawTrim !== codeNorm) {
      queries.push({ field: "codigoEstudiantil", value: rawTrim })
    }
  }

  return queries
}

/**
 * Busca un miembro en gym_cdu por cédula o código estudiantil (coincidencia exacta).
 * Máximo unas pocas lecturas indexadas; nunca escanea la colección completa.
 */
export async function searchGymUserByCode(searchTerm: string): Promise<GymUserProfile | undefined> {
  const raw = searchTerm.trim()
  if (!raw) return undefined

  try {
    const queries = buildLookupQueries(raw)
    if (queries.length === 0) {
      return undefined
    }

    const docs = await queryByAnyEquality(queries)
    const match = docs.find((d) => d.data().activo !== false)
    if (!match) return undefined

    return normalizeUserDoc(match.id, match.data() as Record<string, unknown>)
  } catch (error) {
    console.error("Error en searchGymUserByCode:", error)
    return undefined
  }
}
