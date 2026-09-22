# 🍸 Cocktail Bar

Aplicación en **Angular** para explorar y buscar cócteles (por nombre, ingrediente o ID), ver sus recetas e ingredientes con medidas, y guardar favoritos que se mantienen sincronizados entre pestañas y navegaciones.

---

## 📂 Estructura del Proyecto

Arquitectura modular en capas **Core**, **Features** y **Shared**, con componentes *standalone* y lazy-loading por ruta:

```plaintext
cocktail-bar/
├── public/                     # Recursos estáticos (favicon, etc.)
├── src/
│   ├── app/
│   │   ├── core/               # Lógica reutilizable de la app
│   │   │   ├── models/         # Interfaces de dominio y tipos (cocktail, ingredient, search…)
│   │   │   └── services/       # cocktail.service (API, caché, favoritos) · state.service (navegación)
│   │   ├── features/           # Vistas por funcionalidad (una carpeta por ruta)
│   │   │   ├── cocktail-list/  # Listado, filtros, scroll infinito
│   │   │   └── cocktail-detail/# Detalle de receta
│   │   ├── shared/             # Componentes reutilizables
│   │   │   └── components/     # cocktail-card · cocktail-search
│   │   ├── app.config.ts       # Proveedores globales (router, HTTP, scroll)
│   │   ├── app.routes.ts       # Rutas (lazy-loaded)
│   │   └── app.component.*     # Componente raíz
│   ├── environments/           # Variables de entorno (URL de TheCocktailDB)
│   ├── styles.scss             # Estilos globales
│   └── main.ts                 # Punto de entrada (bootstrap)
├── angular.json                # Builders y configuración del CLI
├── eslint.config.mjs           # ESLint (flat config + angular-eslint)
├── tsconfig.json               # TypeScript + aliases (@core/*, @shared/*)
└── package.json                # Dependencias y scripts
```

Cada componente incluye sus archivos junto a él (`*.ts`, `*.html`, `*.scss` y `*.spec.ts`), y los imports usan aliases (`@core/…`, `@shared/…`) en lugar de rutas relativas largas.

---

## 🛠️ Decisiones Técnicas

| Tema | Elección | Por qué |
| --- | --- | --- |
| Arquitectura | Capas `core` / `features` / `shared` | Separa lógica reutilizable de las vistas y escala de forma natural a medida que crece la app. |
| Componentes | *Standalone* (`standalone: true`) | Elimina el boilerplate de `NgModule` y simplifica la gestión de dependencias por componente. |
| Rendimiento | `ChangeDetectionStrategy.OnPush` + Signals | Solo se recalculan las vistas cuando los datos cambian; evita ciclos de detección innecesarios. |
| Reactividad | `BehaviorSubject` + `debounceTime`/`throttleTime` | Evita renderizar por cada tecla (búsquedas) y mantiene fluido el scroll infinito. |
| Caché de datos | `localStorage` con TTL de 24 h (`StoredCatalog`) | Reduce llamadas a la API pública y mejora la carga percibida. |
| Sync entre pestañas | `BroadcastChannel` + evento `storage` | Favoritos y catálogo se actualizan al instante en todas las pestañas abiertas. |
| Preservación de estado | `StateService` singleton | Al volver del detalle no se pierden el término, el filtro ni la vista de favoritos. |
| Datos de la API | `CocktailApiDrink` + `parseCocktails` | Tipado estricto sin `any`; normaliza los 15 pares `strIngredientN`/`strMeasureN` de TheCocktailDB a un arreglo `Ingredient[]`. |
| Estilos | Bootstrap 5 + SCSS por componente | Diseño responsive rápido con grilla y utilidades, más estilos propios. |
| Testing | **Vitest** (`@angular/build:unit-test`) + jsdom | Ejecución instantánea sin levantar un navegador, ideal para CI/CD. |
| Calidad | ESLint (`angular-eslint`) + Prettier | Detecta malas prácticas y accesibilidad en templates; el formato queda uniforme. |
| Templates e imports | Control flow nativo (`@if`/`@for`) + aliases | Más legibles y eficientes que `*ngIf`/`*ngFor`; imports cortos y estables. |

---

## 🚀 Cómo Ejecutar y Probar

### Requisitos

- **Node.js** `v20.19.x` o `v22.12.x` o superior (compatible con Angular 22).
- **npm** `v12.x` o superior (el proyecto fija `packageManager: npm@12.0.2`).

Verifica con `node -v` y `npm -v`. Luego instala las dependencias:

```bash
npm install
```

### Desarrollo

```bash
npm start          # o npx ng serve → http://localhost:4200/
```

El servidor recarga automáticamente ante cambios en el código.

### Tests

```bash
npm test                      # suite unitaria con Vitest
npx ng test --coverage        # reporte de cobertura
```

### Lint y formato

```bash
npm run lint         # ESLint (reglas de Angular + templates)
npm run format       # Prettier: reescribe los archivos
npm run format:check # Prettier: verifica sin modificar (útil en CI)
```

### Build de producción

```bash
npm run build        # o npx ng build
```

Genera artefactos optimizados (hashing, minificación, tree-shaking) en `dist/cocktail-bar/browser`.