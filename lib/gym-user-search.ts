import { lookupGymUser } from "./gym-user-lookup"
import type { GymUserProfile } from "./gym-user-types"

/** Alias para la API; misma lógica que stock_cdu_Sanfer. */
export async function searchGymUserByCode(searchTerm: string): Promise<GymUserProfile | undefined> {
  const user = await lookupGymUser(searchTerm)
  return user ?? undefined
}
