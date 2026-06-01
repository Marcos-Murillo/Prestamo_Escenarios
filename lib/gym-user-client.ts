import { lookupGymUser } from "./gym-user-lookup"
import { toGymUserPublic, type GymUserPublic } from "./gym-user-types"

export function getGymCduRegistrationUrl(): string {
  return process.env.NEXT_PUBLIC_URL_GYM_CDU ?? "https://gym-cdu-two.vercel.app"
}

export async function searchGymUser(
  term: string,
): Promise<{ found: boolean; user: GymUserPublic | null; error?: string }> {
  const t = term.trim()
  if (!t) {
    return { found: false, user: null, error: "Ingresa tu cédula o código estudiantil." }
  }

  try {
    const profile = await lookupGymUser(t)
    if (!profile) {
      return { found: false, user: null }
    }
    if (!profile.activo) {
      return {
        found: false,
        user: null,
        error: "Tu usuario no está activo en Gym Control. Contacta al personal del CDU.",
      }
    }
    return { found: true, user: toGymUserPublic(profile) }
  } catch {
    return { found: false, user: null, error: "Error al buscar. Intenta de nuevo." }
  }
}
