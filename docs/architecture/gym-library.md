# Gym Library - Librería Compartida

Gym-library es una librería Angular que contiene código reutilizable entre gym-admin y gym-app para promover consistencia y mantenimiento.

## ¿Qué contiene?

- **Modelos e interfaces TypeScript**: User, Routine, Exercise, etc.
- **Servicios compartidos**: AuthService, UserService, RoutineService, FirebaseService.
- **Guards y pipes**: AuthGuard, RoleGuard, DateFormatPipe.
- **Utilidades**: Validadores, formateadores, constantes.

## ¿Qué NO contiene?

- Variables de entorno, rutas específicas, páginas completas, lógica de negocio específica, assets.
