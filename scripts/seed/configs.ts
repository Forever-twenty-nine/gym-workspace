import { SeedConfig } from "../interfaces/seed-config.interface";
import { gymFreeAllFreeConfig } from "../constants/gym-free-all-free";
import { gymPremiumAllPremiumConfig } from "../constants/gym-premium-all-premium";
import { slugifyName } from "./uid";

export const ALL_SEED_CONFIGS: SeedConfig[] = [
  gymFreeAllFreeConfig,
  gymPremiumAllPremiumConfig,
];

const CONFIG_ALIASES: Record<string, SeedConfig> = {
  "gym-free-all-free": gymFreeAllFreeConfig,
  "gym-premium-all-premium": gymPremiumAllPremiumConfig,
};

export function resolveSeedConfig(configName: string): SeedConfig | undefined {
  if (CONFIG_ALIASES[configName]) {
    return CONFIG_ALIASES[configName];
  }

  return ALL_SEED_CONFIGS.find(
    (c) => c.gym.id === configName || slugifyName(configName) === slugifyName(c.gym.nombre)
  );
}