import * as path from "path";
import { getSeedBucket } from "./context";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";

/**
 * Mapa de imágenes de perfil individuales por uid.
 * Permite que cada usuario tenga su propia foto de perfil.
 */
const PROFILE_IMAGE_BY_UID: Record<string, string> = {
  // Gimnasios
  "gym_free_all_free":        "gym_free.png",
  "gym_premium_all_premium":  "gym_premium.png",
  // Entrenadores Free
  "trainer_juanentrenadforfree": "trainer_juan_free.png",
  "trainer_mariaentrenadorafree": "trainer_maria_free.png",
  // Entrenadores Premium
  "trainer_carlosrodriguezpremium": "trainer_carlos_premium.png",
  "trainer_anamartinezpremium":     "trainer_ana_premium.png",
  // Entrenados Free
  "trainee_lucasprincipiante":   "trainee_lucas.png",
  "trainee_pedrointermedio":     "trainee_pedro.png",
  "trainee_tomasavanzado":       "trainee_tomas.png",
  "trainee_sofiaprincipiante":   "trainee_sofia.png",
  "trainee_claraintermedio":     "trainee_clara.png",
  "trainee_mateoavanzado":       "trainee_mateo.png",
  // Entrenados Premium
  "trainee_juanperezpremium":    "trainee_juan_perez.png",
  "trainee_mariagarciapremium":  "trainee_maria_garcia.png",
  "trainee_luisfernandezpremium":"trainee_luis_fernandez.png",
  "trainee_sofiaruizpremium":    "trainee_sofia_ruiz.png",
  "trainee_javiercastropremium": "trainee_javier_castro.png",
  "trainee_luciamoralespremium": "trainee_lucia_morales.png",
};

/**
 * Lista de fotos de publicaciones (rotadas por índice para dar variedad).
 */
const POST_IMAGES = [
  "post_workout_1.png",
  "post_workout_2.png",
  "post_workout_3.png",
  "post_workout_4.png",
  "post_workout_5.png",
  "post_workout_6.png",
];

function getFallbackProfileImageName(name: string, role: string, plan: Plan): string {
  const normalized = name.toLowerCase();
  const isPremium = plan === Plan.PREMIUM;

  if (role === "gimnasio") {
    return isPremium ? "gym_premium.png" : "gym_free.png";
  }

  if (role === "entrenador") {
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

export async function uploadPostImage(
  userId: string,
  postIndex: number
): Promise<string | undefined> {
  const imageName = POST_IMAGES[postIndex % POST_IMAGES.length];
  const localPath = path.join(process.cwd(), "scripts", "assets", "images", "posts", imageName);
  const destination = `posts/${userId}/post_${postIndex}.png`;

  try {
    await getSeedBucket().upload(localPath, {
      destination,
      metadata: { contentType: "image/png" },
    });
    return `http://127.0.0.1:9199/v0/b/default-project.appspot.com/o/posts%2F${userId}%2Fpost_${postIndex}.png?alt=media`;
  } catch (e) {
    console.warn(`⚠️ No se pudo subir la imagen de post para ${userId} a Storage:`, e);
    return undefined;
  }
}

export async function resolveProfilePhoto(
  userId: string,
  name: string,
  role: string,
  plan: Plan
): Promise<string | undefined> {
  // Primero intenta la imagen individual por uid
  const individualImage = PROFILE_IMAGE_BY_UID[userId];
  if (individualImage) {
    return uploadProfileImage(userId, individualImage);
  }
  // Fallback: imagen genérica por rol/plan
  return uploadProfileImage(userId, getFallbackProfileImageName(name, role, plan));
}