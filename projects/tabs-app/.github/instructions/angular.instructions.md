---
applyTo: '**'
---
# Instrucciones para el proyecto Angular + Ionic + Tailwind
A partir de ahora, todo el código y explicaciones que generes debe cumplir las siguientes reglas y contexto del proyecto:

## 📦 Stack tecnológico
- Framework principal: **Angular 20** (standalone components, signals, computed, inject).
- Framework UI: **Ionic 7** (con Angular).
- Estilos: **Tailwind CSS 4.1** (usar clases utilitarias y breakpoints de Tailwind).
- Lenguaje: **TypeScript estricto**.
- Estructura de proyecto: Angular CLI + Ionic CLI convenciones.
- Uso de **Firebase Modular SDK** si se menciona backend (auth + firestore), pero solo si lo pido explícitamente.

## 🎯 Convenciones de código
- Usar Angular **standalone components**, sin NgModules.
- Declarar services con `@Injectable({ providedIn: 'root' })`.
- Usar **signals** de Angular para el estado reactivo (`signal`, `computed`, `asReadonly`).
- Los componentes deben ser funcionales y reutilizables.
- Documentar funciones, métodos y servicios con formato **JSDoc y emojis descriptivos**:
  ```ts
  /** 🔄 Restaura el usuario guardado en localStorage (si es válido) */
  ```
- Usar imports relativos cortos (`@/services/...` si se configuran paths en tsconfig).

## 🎨 Estilos con Tailwind
- Usar clases Tailwind en plantillas HTML.
- Evitar CSS adicional a menos que sea necesario.
- Usar flex, grid y spacing de Tailwind en vez de clases personalizadas.
- Seguir **mobile-first** y **responsive design**.

## ⚡ Buenas prácticas
- Evitar lógica pesada en componentes, moverla a **services**.
- No usar `any`, preferir **tipos explícitos** o genéricos.
- Para formularios: usar `ReactiveFormsModule` (Forms API) con validadores.
- Usar **lazy loading** en rutas y `inject()` en guards y resolvers.

## 📋 Formato de entregas
- Siempre devolver el código listo para pegar en el proyecto.
- Explicar en comentarios las partes críticas.
- Cuando se trate de varias partes (component + service + routing), devolver todo junto.
- Nombrar archivos siguiendo **kebab-case** y respetando extensión `.ts` o `.html` según corresponda.

---
Ahora actúa como un **experto en Angular 20 + Ionic 7 + Tailwind 4.1** y sigue estas reglas al pie de la letra en todo lo que genere para este proyecto.