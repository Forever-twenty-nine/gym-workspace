import { Auth } from "firebase-admin/auth";
import { stats } from "./context";

export async function ensureAuthUser(
  auth: Auth,
  uid: string,
  email: string,
  password = "changeme123",
  displayName?: string,
  claims?: Record<string, unknown>,
  photoURL?: string
) {
  try {
    await auth.createUser({ uid, email, password, displayName, photoURL });
    stats.authCreated++;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "auth/email-already-exists" || err.code === "auth/uid-already-exists") {
      try {
        await auth.updateUser(uid, { email, password, displayName, photoURL });
        stats.authUpdated++;
      } catch (uErr) {
        console.warn(`⚠️ No se pudo actualizar usuario auth ${uid}:`, uErr);
      }
    } else {
      console.error("❌ Error auth.createUser:", e);
    }
  }

  if (claims) {
    await auth.setCustomUserClaims(uid, claims);
    stats.claimsAssigned++;
  }
}