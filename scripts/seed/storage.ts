import * as path from "path";
import { getSeedBucket } from "./context";

function getLocalImageName(name: string, role: string, plan: string): string {
  const normalized = name.toLowerCase();
  const isPremium = plan === "premium";

  if (role === "gimnasio") {
    return isPremium ? "gym_premium.png" : "gym_free.png";
  }

  if (role === "entrenador" || role === "personal_trainer") {
    const isFemale =
      normalized.includes("ana") ||
      normalized.includes("maria") ||
      normalized.includes("valeria");
    return isFemale
      ? isPremium
        ? "trainer_premium_female.png"
        : "trainer_free_female.png"
      : isPremium
        ? "trainer_premium_male.png"
        : "trainer_free_male.png";
  }

  const isFemale =
    normalized.includes("maria") ||
    normalized.includes("sofia") ||
    normalized.includes("clara") ||
    normalized.includes("lucia") ||
    normalized.includes("carmen") ||
    normalized.includes("isabel") ||
    normalized.includes("patricia") ||
    normalized.includes("carla") ||
    normalized.includes("daniela") ||
    normalized.includes("florencia") ||
    normalized.includes("marina") ||
    normalized.includes("alumna");

  return isFemale
    ? isPremium
      ? "trainee_premium_female.png"
      : "trainee_free_female.png"
    : isPremium
      ? "trainee_premium_male.png"
      : "trainee_free_male.png";
}

export async function uploadProfileImage(
  userId: string,
  localImageName: string
): Promise<string | undefined> {
  const localPath = path.join(process.cwd(), "scripts", "assets", "images", "profiles", localImageName);
  const destination = `profiles/${userId}/profile.png`;

  try {
    await getSeedBucket().upload(localPath, {
      destination,
      metadata: { contentType: "image/png" },
    });
    return `http://127.0.0.1:9199/v0/b/default-project.appspot.com/o/profiles%2F${userId}%2Fprofile.png?alt=media`;
  } catch (e) {
    console.warn(`⚠️ No se pudo subir la imagen de perfil para ${userId} a Storage:`, e);
    return undefined;
  }
}

export async function resolveProfilePhoto(
  userId: string,
  name: string,
  role: string,
  plan: string
): Promise<string | undefined> {
  return uploadProfileImage(userId, getLocalImageName(name, role, plan));
}