/**
 * Enum que define los diferentes conjuntos de tabs disponibles para usuarios con rol de gimnasio.
 * Cada conjunto representa una vista específica adaptada a las necesidades del gimnasio.
 */
export enum GimnasioTabsSet {
  GESTION = 'gestion',                    // Gestión básica: Usuarios, Dashboard
  COMPLETO = 'completo',                  // Acceso completo a todas las funcionalidades
  REPORTES = 'reportes'                   // Enfocado en análisis y reportes
}

/**
 * Configuración de tabs disponibles para cada conjunto del gimnasio.
 * Define qué tabs específicos están disponibles en cada conjunto.
 */
export const GIMNASIO_TABS_CONFIG = {
  [GimnasioTabsSet.GESTION]: [
    'dashboard',
    'usuarios',
    'configuracion'
  ],
  [GimnasioTabsSet.REPORTES]: [
    'dashboard',
    'reportes',
    'estadisticas',
    'configuracion'
  ],
  [GimnasioTabsSet.COMPLETO]: [
    'dashboard',
    'usuarios',
    'entrenadores',
    'clientes',
    'reportes',
    'estadisticas',
    'configuracion',
    'perfil'
  ]
} as const;

/**
 * Tipos derivados para mayor seguridad de tipos
 */
export type GimnasioTabId = string;
export type GimnasioTabsConfig = typeof GIMNASIO_TABS_CONFIG;
