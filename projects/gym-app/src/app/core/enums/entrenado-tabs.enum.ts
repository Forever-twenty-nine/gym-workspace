/**
 * Enum que define los tipos de tabs disponibles para usuarios con rol de entrenado.
 * Simplificado a solo 3 tabs esenciales.
 */
export enum EntrenadoTabsSet {
  BASICO = 'basico'           // Tabs básicos: Rutinas, Ejercicios, Perfil
}

/**
 * Configuración de tabs disponibles.
 * Solo incluye los 3 tabs esenciales para el entrenado.
 */
export const ENTRENADO_TABS_CONFIG = {
  [EntrenadoTabsSet.BASICO]: [
    'rutinas',
    'ejercicios', 
    'perfil'
  ]
} as const;

/**
 * Tipos derivados para mayor seguridad de tipos
 */
export type EntrenadoTabId = string;
export type EntrenadoTabsConfig = typeof ENTRENADO_TABS_CONFIG;
