import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getFirestore, Firestore } from "firebase-admin/firestore"

const APP_NAME = "gym-cdu"

export function isGymCduConfigured(): boolean {
  return Boolean(
    process.env.GYM_CDU_ADMIN_PROJECT_ID &&
      process.env.GYM_CDU_ADMIN_CLIENT_EMAIL &&
      process.env.GYM_CDU_ADMIN_PRIVATE_KEY,
  )
}

export function getGymCduDb(): Firestore {
  const existing = getApps().find((a) => a.name === APP_NAME)
  if (existing) return getFirestore(existing)

  if (!isGymCduConfigured()) {
    throw new Error("Missing GYM_CDU_ADMIN_* environment variables")
  }

  const app = initializeApp(
    {
      credential: cert({
        projectId: process.env.GYM_CDU_ADMIN_PROJECT_ID,
        clientEmail: process.env.GYM_CDU_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.GYM_CDU_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    },
    APP_NAME,
  )

  return getFirestore(app)
}
