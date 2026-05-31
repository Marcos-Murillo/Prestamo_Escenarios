/** Perfil de miembro en gym_cdu (colección `users`). Solo lectura desde prestamos. */
export interface GymUserProfile {
  id: string
  nombres: string
  correo: string
  genero: string
  tipoDocumento: string
  numeroDocumento: string
  edad: number
  telefono: string
  estamento: string
  facultad: string
  programaAcademico: string
  codigoEstudiantil?: string
  fechaRegistro: string
  activo: boolean
}

/** Respuesta pública de búsqueda (sin datos sensibles innecesarios). */
export interface GymUserPublic {
  id: string
  nombres: string
  correo: string
  numeroDocumento: string
  codigoEstudiantil?: string
  estamento: string
  facultad: string
  programaAcademico: string
}

export function toGymUserPublic(user: GymUserProfile): GymUserPublic {
  return {
    id: user.id,
    nombres: user.nombres,
    correo: user.correo,
    numeroDocumento: user.numeroDocumento,
    codigoEstudiantil: user.codigoEstudiantil,
    estamento: user.estamento,
    facultad: user.facultad,
    programaAcademico: user.programaAcademico,
  }
}
