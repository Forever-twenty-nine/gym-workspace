# 💪 Entrenados - Features

> Listado de funcionalidades por plan

## 🔗 Modelo de Conexión

**Sistema de invitación por email:**

El cliente no puede registrarse por su cuenta. Debe ser invitado por un entrenador:

1. **Invitación:** El entrenador envía invitación con token único
2. **Registro:** El cliente se registra usando el link de invitación
3. **Vinculación:** Quedan conectados automáticamente
4. **Acceso restringido:** Solo ve rutinas asignadas por sus entrenadores

> **Importante:** No hay perfiles públicos ni búsqueda de usuarios.

## 🆓 Plan Free

### ✅ Funcionalidades Incluidas

**Rutinas:**
- Ver rutinas asignadas por entrenador
- Iniciar y registrar ejercicios completados
- Ver detalles de cada ejercicio (series, reps, peso, notas)
- Historial limitado: últimas 2 rutinas

**Progreso:**
- Contador de rutinas completadas
- Racha de entrenamiento (días consecutivos)
- Progreso básico por rutina (% completado)

**Social:**
- Compartir progreso en RRSS (Instagram, Facebook, Twitter)
- Incluye watermark "Powered by [App]"

**Notificaciones:**
- Push: Nueva rutina asignada
- Push: Recordatorio de entrenamiento (configurable)
- Email: Resumen semanal

### ❌ Restricciones

- Solo 2 rutinas en historial (las más recientes)
- Sin estadísticas avanzadas
- Sin exportación PDF/Excel
- Watermark obligatorio al compartir
- Anuncios intersticiales cada X acciones

## 💎 Plan Premium

### ✅ Todo lo de Free +

**Rutinas:**
- Historial completo e ilimitado de rutinas
- Búsqueda y filtros en historial
- Rutinas personalizadas avanzadas

**Estadísticas Avanzadas:**
- Gráficas de progreso temporal (líneas, barras)
- Volumen total levantado (acumulado)
- Tiempo total de entrenamiento
- Calorías estimadas quemadas
- Distribución por grupo muscular
- Comparativas mes vs mes
- Personal Records (PRs) destacados

**Exportación:**
- Descargar rutinas en PDF (sin watermark)
- Exportar historial a Excel/CSV
- Generar imágenes optimizadas para RRSS (sin marca)

**Experiencia:**
- Sin anuncios
- Soporte prioritario

**Comunicación:**
- Chat directo con entrenador (si entrenador tiene Plan Pro)
- Notificaciones prioritarias

**Múltiples Entrenadores:**
- Conexión ilimitada con varios entrenadores
- Panel para gestionar múltiples programas simultáneamente

## 📊 Dashboard del Usuario

### Vista Principal (Home)

**Componentes:**
```
┌─────────────────────────────────────┐
│  Hola, [Nombre] 👋                  │
│  Racha actual: 🔥 5 días            │
├─────────────────────────────────────┤
│  📋 RUTINAS ASIGNADAS               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💪 Rutina: Full Body        │   │
│  │ 👨‍🏫 Por: Coach Juan          │   │
│  │ 📅 Asignada: Hace 2 días    │   │
│  │ ✅ 60% completada           │   │
│  │ [Continuar] [Ver detalles]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏃 Rutina: Cardio HIIT      │   │
│  │ 👨‍🏫 Por: Coach María         │   │
│  │ 🆕 Nueva                     │   │
│  │ [Iniciar]                   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Navegación inferior:**
- 🏠 Inicio
- 📊 Progreso (Premium: gráficas / Free: básico)
- 📜 Historial (Premium: todo / Free: últimas 2)
- 👤 Perfil

### Panel de Progreso

**Free:**
- Rutinas completadas (últimos 7/30 días) - gráfico simple
- Racha actual y mejor racha
- Ejercicios completados (contador)

**Premium:**
- Todo lo anterior +
- Volumen total levantado (gráfico de línea temporal)
- Tiempo de entrenamiento por semana (gráfico barras)
- Calorías quemadas estimadas
- Distribución por grupo muscular (gráfico circular)
- PRs (lista con fecha y ejercicio)
- Comparativa periódica (mes vs mes, etc.)

### Vista de Rutina

**Durante el workout:**
```
┌─────────────────────────────────────┐
│  Full Body - Día 1                  │
│  ⏱️ 45 minutos | 💪 8 ejercicios     │
├─────────────────────────────────────┤
│  Ejercicio 1/8                      │
│                                     │
│  🏋️ Press de Banca                  │
│  4 series x 10 reps                 │
│  Peso: 60kg                         │
│                                     │
│  Serie 1: ✅ [10 reps] [60kg]       │
│  Serie 2: ✅ [10 reps] [60kg]       │
│  Serie 3: ⏸️ [_ reps] [_kg]         │
│  Serie 4: ⏸️ [_ reps] [_kg]         │
│                                     │
│  💡 Nota: Mantén espalda apoyada    │
│  🎥 [Ver video demo]                │
│                                     │
│  [⏸️ Descanso 90s] [Siguiente ▶️]   │
└─────────────────────────────────────┘
```

## 🔔 Notificaciones

### Push Notifications

**Free y Premium:**
- Nueva rutina asignada → Inmediato
- Logro desbloqueado (racha, PR) → Inmediato
- Recordatorio de entrenamiento → Horario configurable
- Inactividad 3+ días → Recordatorio motivacional

**Solo Premium:**
- Mensaje del entrenador → Inmediato
- Análisis semanal listo → Lunes 9am

### Configuración de Usuario

```json
{
  "notifications": {
    "new_routine": true,
    "reminders": true,
    "reminder_time": "18:00",
    "achievements": true,
    "messages": true,      // Solo Premium
    "weekly_summary": true
  }
}
```

## 📤 Exportación y Compartir

### Compartir en RRSS

**Funcionalidad:**
- Generar imagen 1080x1080px con estadística destacada
- Free: Incluye watermark "Powered by [App]"
- Premium: Sin watermark
- Compartir en: Instagram, Facebook, Twitter, WhatsApp

**Opciones de contenido:**
- Mi mejor racha
- PR alcanzado
- Rutina completada
- Resumen semanal/mensual

### Exportación (Solo Premium)

**PDF - Rutina:**
- Rutina completa con todos los ejercicios
- Incluir imágenes de ejercicios
- Notas del entrenador
- Sin marca de agua

**Excel/CSV - Historial:**
- Fecha, rutina, ejercicios, series, reps, peso
- Totales y promedios
- Listo para análisis externo

**Imagen PNG:**
- Estadísticas personalizadas
- Optimizada para RRSS
- Sin watermark

## 🎯 Features Futuros (Roadmap)

### Fase 3: Personalización
- [ ] Rutinas personalizadas IA según progreso
- [ ] Planes especializados (hipertrofia, pérdida grasa, etc.)
- [ ] Recomendaciones de descanso adaptativas
- [ ] Ajuste automático de pesos sugeridos

### Fase 4: Comunidad
- [ ] Feed de actividad (solo tus entrenadores)
- [ ] Retos personales
- [ ] Sistema de logros y badges
- [ ] Comparativas anónimas con otros usuarios

---

**Ver también:**
- [Especificaciones Técnicas](technical.md)
- [Entrenadores](../trainers/features.md)
- [Gimnasios](../gyms/features.md)
