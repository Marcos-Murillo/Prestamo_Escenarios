import type { GymUserPublic } from "./gym-user-types"

export function getGymCduRegistrationUrl(): string {
  return process.env.NEXT_PUBLIC_URL_GYM_CDU ?? "https://gym-cdu.vercel.app"
}

function apiBase(): string {
  if (typeof window !== "undefined") return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL ?? ""
}

export async function searchGymUser(term: string): Promise<{ found: boolean; user: GymUserPublic | null; error?: string }> {
  const url = `${apiBase()}/api/gym-users/search`

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: term.trim() }),
    })
  } catch {
    return { found: false, user: null, error: "No se pudo conectar con el servidor." }
  }

  if (res.status === 404) {
    return {
      found: false,
      user: null,
      error:
        "No se encontró la API de búsqueda. Asegúrate de ejecutar «npm run dev» dentro de prestamos_escenarios (no otro proyecto en el mismo puerto) y reinicia el servidor.",
    }
  }

  let data: { error?: string; found?: boolean; user?: GymUserPublic | null }
  try {
    data = await res.json()
  } catch {
    return { found: false, user: null, error: "Respuesta inválida del servidor." }
  }

  if (!res.ok) {
    return { found: false, user: null, error: data.error ?? "Error al buscar" }
  }

  return { found: Boolean(data.found), user: data.user ?? null }
}
