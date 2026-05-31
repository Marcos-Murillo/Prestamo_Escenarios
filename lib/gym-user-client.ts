import type { GymUserPublic } from "./gym-user-types"

export function getGymCduRegistrationUrl(): string {
  return process.env.NEXT_PUBLIC_URL_GYM_CDU ?? "https://gym-cdu.vercel.app"
}

export async function searchGymUser(term: string): Promise<{ found: boolean; user: GymUserPublic | null; error?: string }> {
  const res = await fetch("/api/gym-users/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term: term.trim() }),
  })

  const data = await res.json()

  if (!res.ok) {
    return { found: false, user: null, error: data.error ?? "Error al buscar" }
  }

  return { found: Boolean(data.found), user: data.user ?? null }
}
