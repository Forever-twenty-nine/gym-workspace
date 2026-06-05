import { SeedConfig } from "../interfaces/seed-config.interface";
import { gymFreeAllFreeConfig } from "../constants/gym-free-all-free";
import { gymPremiumAllPremiumConfig } from "../constants/gym-premium-all-premium";
import { ptFreeAllFreeConfig } from "../constants/pt-free-all-free";
import { ptPremiumAllPremiumConfig } from "../constants/pt-premium-all-premium";
import { slugifyName } from "./uid";

export const ALL_SEED_CONFIGS: SeedConfig[] = [
  gymFreeAllFreeConfig,
  gymPremiumAllPremiumConfig,
  ptFreeAllFreeConfig,
  ptPremiumAllPremiumConfig,
];

const CONFIG_ALIASES: Record<string, SeedConfig> = {
  "gym-free-all-free": gymFreeAllFreeConfig,
  "gym-premium-all-premium": gymPremiumAllPremiumConfig,
  "pt-free-all-free": ptFreeAllFreeConfig,
  "pt-premium-all-premium": ptPremiumAllPremiumConfig,
};

export function resolveSeedConfig(configName: string): SeedConfig | undefined {
  if (CONFIG_ALIASES[configName]) {
    return CONFIG_ALIASES[configName];
  }

  return ALL_SEED_CONFIGS.find(
    (c) => c.gym.id === configName || slugifyName(configName) === slugifyName(c.gym.nombre)
  );
}