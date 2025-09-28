/**
 * Enum que define los tipos de tabs disponibles para usuarios con rol de cliente.
 * Simplificado a solo 3 tabs esenciales.
 */
export enum ClienteTabsSet {
  BASICO = 'basico'           // Tabs básicos: Entrenamientos, Ejercicios, Perfil
}

/**
 * Configuración de tabs disponibles.
 * Solo incluye los 3 tabs esenciales para el cliente.
 */
export const CLIENTE_TABS_CONFIG = {
  [ClienteTabsSet.BASICO]: [
    'entrenamientos',
    'ejercicios', 
    'perfil'
  ]
} as const;

/**
 * Tipos derivados para mayor seguridad de tipos
 */
export type ClienteTabId = string;
export type ClienteTabsConfig = typeof CLIENTE_TABS_CONFIG;
