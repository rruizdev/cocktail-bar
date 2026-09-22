# 🍸 Cocktail Bar

Desarrollado en  **Angular** para:
- Explorar recetas de cócteles.
- Buscar por diferentes criterios (nombre, ingrediente, ID).
- Visualizar recetas con medidas detalladas.
- Guardar favoritos.
- Mantener el estado sincronizado entre pestañas y navegaciones.

---

## 📋 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Decisiones Técnicas y Patrones de Diseño](#-decisiones-técnicas-y-patrones-de-diseño)
4. [Requisitos Previos](#-requisitos-previos)
5. [Instalación y Configuración](#-instalación-y-configuración)
6. [Ejecución de la Aplicación](#-ejecución-de-la-aplicación)
7. [Pruebas Unitarias (Testing)](#-pruebas-unitarias-testing)
8. [Compilación para Producción](#-compilación-para-producción)

---

## ✨ Características Principales

- **Exploración de Catálogo**: Carga inicial y visualización de cócteles con scroll infinito.
- **Búsqueda Avanzada Multifiltro**: Búsqueda en tiempo real por **Nombre**, **Ingrediente** o **ID** con validación y sanitización de caracteres según el criterio.
- **Gestión de Favoritos**: Posibilidad de marcar o desmarcar cócteles favoritos y alternar la vista para mostrar exclusivamente los favoritos.
- **Sincronización Multi-pestaña**: Los favoritos y el catálogo se sincronizan en tiempo real entre múltiples pestañas del navegador mediante `BroadcastChannel` y eventos `storage`.
- **Persistencia con Expiración (TTL)**: Catálogo en caché `localStorage` con 1 día de duración para minimizar llamadas a la API externa.
- **Preservación de Estado**: Al navegar al detalle de un cóctel y volver, se conserva el término de búsqueda, el criterio seleccionado y los filtros activos.
- **Detalle de Cóctel Completo**: Vista con ingredientes parseados dinámicamente con sus respectivas medidas, tipo de copa, categoría e instrucciones.

---

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura modular y escalable recomendada por Angular, separando responsabilidades en capas **Core**, **Features** y **Shared**:

```plaintext
cocktail-bar/
├── public/                     # Recursos públicos estáticos (favicon, etc.)
├── src/
│   ├── app/
│   │   ├── core/               # Núcleo de la app (servicios singleton, modelos globales)
│   │   │   ├── models/         # Modelos e interfaces TypeScript
│   │   │   │   ├── cocktail.model.ts       # Modelo de cóctel y respuesta API
│   │   │   │   ├── Ingredient.model.ts     # Modelo para ingredientes normalizados
│   │   │   │   ├── search-type.model.ts    # Tipos de búsqueda ('name' | 'ingredient' | 'id')
│   │   │   │   ├── search.model.ts         # Estructura del estado de búsqueda
│   │   │   │   └── stored-catalog.model.ts # Estructura de caché con timestamp TTL
│   │   │   └── services/       # Lógica de negocio y acceso a datos
│   │   │       ├── cocktail.service.ts     # Comunicación con API, caché, favoritos y sync
│   │   │       └── state.service.ts        # Preservación del estado de navegación/búsqueda
│   │   │
│   │   ├── features/           # Vistas y funcionalidades de la aplicación
│   │   │   ├── cocktail-list/              # Vista principal: listado, filtros y scroll
│   │   │   │   ├── cocktail-list.component.ts
│   │   │   │   ├── cocktail-list.component.html
│   │   │   │   ├── cocktail-list.component.scss
│   │   │   │   └── cocktail-list.component.spec.ts
│   │   │   └── cocktail-detail/            # Vista de detalle del cóctel seleccionado
│   │   │       ├── cocktail-detail.component.ts
│   │   │       ├── cocktail-detail.component.html
│   │   │       ├── cocktail-detail.component.scss
│   │   │       └── cocktail-detail.component.spec.ts
│   │   │
│   │   ├── shared/             # Componentes, directivas o pipes reutilizables
│   │   │   └── components/
│   │   │       ├── cocktail-card/          # Tarjeta visual individual de cada cóctel
│   │   │       └── cocktail-search/        # Barra de búsqueda y controles de filtro
│   │   │
│   │   ├── app.config.ts       # Configuración global (proveedores, router, fetch HTTP)
│   │   ├── app.routes.ts       # Definición de rutas principales
│   │   ├── app.ts / app.html   # Componente raíz de la aplicación
│   │   └── app.spec.ts         # Pruebas del componente raíz
│   │
│   ├── environments/           # Variables de entorno (URLs de la API TheCocktailDB)
│   ├── styles.scss             # Estilos globales y variables de tema
│   └── main.ts                 # Punto de entrada de la aplicación
├── angular.json                # Configuración del CLI de Angular y builders
├── package.json                # Dependencias y scripts del proyecto
└── tsconfig.json               # Configuración de compilación de TypeScript
```

---

## 🛠️ Decisiones Técnicas y Patrones de Diseño

### 1. Componentes _Standalone_
- **Decisión**: Se utilizan componentes independientes (`standalone: true`) sin módulos tradicionales (`NgModule`).
- **Motivo**: Reduce significativamente el código repetitivo y simplifica la gestión de dependencias a nivel de componente.

### 2. Cambios _OnPush_
- **Decisión**: Los componentes principales y de presentación (`CocktailCardComponent`, `CocktailSearchComponent`, `CocktailListComponent`) implementan `ChangeDetectionStrategy.OnPush`.
- **Motivo**: Optimiza drásticamente el rendimiento visual evitando ciclos de verificación innecesarios de Angular cuando ocurren eventos en otras partes del DOM. La actualización se activa únicamente cuando cambian referencias de `@Input()` o mediante eventos locales.

### 3. RxJS
- **Decisión**: Uso de `BehaviorSubject` para el catálogo y favoritos, combinado con operadores reactivos:
  - `debounceTime(250)` y `distinctUntilChanged()` en las búsquedas para no renderizar en cada pulsación de tecla.
  - `throttleTime(100)` al escuchar el evento de scroll (`fromEvent(window, 'scroll')`) para la paginación infinita, asegurando fluidez en la interfaz.

### 4. Cache First
- **Decisión**: El catálogo descargado se almacena en `localStorage` con una estructura de metadatos que incluye un timestamp de inserción y una duración de 24 horas (`StoredCatalog`).
- **Motivo**: Evitar llamadas redundantes a la API pública de TheCocktailDB cada vez que se recarga la página, mejorando los tiempos de carga percibidos por el usuario y respetando los límites de uso de la API externa.

### 5. `BroadcastChannel` y `StorageEvent`
- **Decisión**: Se implementa un canal de comunicación entre pestañas mediante la API nativa `BroadcastChannel` (`'coto_cocktails_sync'`) complementado con un *listener* del evento `storage`.
- **Motivo**: Si un usuario tiene la aplicación abierta en varias pestañas simultáneamente y marca un cóctel como favorito en una de ellas, el cambio se propaga de forma inmediata. La ejecución de las emisiones se envuelve en `NgZone.run()` para garantizar que la vista se actualice al instante.

### 6. Modelo de Datos de la API
- **Decisión**: La API TheCocktailDB entrega los ingredientes y medidas de forma aplanada en 15 propiedades individuales (`strIngredient1` ... `strIngredient15`, `strMeasure1` ... `strMeasure15`). El método `parseCocktails` normaliza esta respuesta a un arreglo estructurado `Ingredient[]` (`{ name, measure }`).
- **Motivo**: Facilita la manipulación en TypeScript, mejora la tipificación estricta y permite iterar de manera limpia mediante `@for` o `*ngFor` en la vista de detalle.

### 7. Preservación del Contexto de Navegación
- **Decisión**: Servicio singleton `StateService` que retiene el término de búsqueda actual, el tipo de filtro seleccionado y si se estaba visualizando solo favoritos.
- **Motivo**: Brinda una experiencia de usuario (UX) fluida; al ingresar al detalle de un cóctel y presionar "Volver", el usuario regresa a su búsqueda previa sin perder sus filtros.

### 8. Vitest 
- **Decisión**: Se reemplaza el ejecutor clásico (Karma/Jasmine) por `@angular/build:unit-test` con **Vitest** y **jsdom**.
- **Motivo**: Vitest ofrece una velocidad de ejecución instantánea gracias a su arquitectura moderna y no requiere levantar un navegador Chromium completo, acelerando el ciclo de desarrollo continuo y CI/CD.

### 9. Bootstrap
- **Decisión**: Combinación del framework de utilidades y sistema de grilla de Bootstrap 5 con hojas de estilo personalizadas en SCSS.
- **Motivo**: Provee un diseño adaptable (responsive) para móviles, tablets y escritorio, con estados de accesibilidad claros (`:focus-visible`) y consistencia visual rápida.

---

## 💻 Requisitos Previos

Es necesario tener instalado:

- **Node.js**: Versión `v20.x` o superior (compatible con Angular 19/20+).
- **npm**: Versión `v10.x` o superior.

Para verificar las versiones:
```bash
node -v
npm -v
```

---

## 🚀 Instalación y Configuración

1. **Clonar el repositorio** (o situarse en el directorio raíz del proyecto):
   ```bash
   cd cocktail-bar
   ```

2. **Instalar las dependencias del proyecto**:
   ```bash
   npm install
   ```

---

## 🖥️ Ejecución de la Aplicación

Para iniciar el servidor de desarrollo local:

```bash
npm start
```
*(o alternativamente `npx ng serve`)*

Una vez iniciado el servidor, abre tu navegador y accede a:
👉 **`http://localhost:4200/`**

La aplicación se recargará automáticamente cada vez que realices cambios en el código fuente.

---

## 🧪 Pruebas Unitarias (Testing)

El proyecto cuenta con una amplia suite de pruebas unitarias cubriendo servicios (comportamiento de caché, TTL, normalización, favoritos), componentes de lista, detalles y componentes compartidos.

Para ejecutar todas las pruebas unitarias con **Vitest**:

```bash
npm test
```
*(o alternativamente `npx ng test`)*

Para generar reporte de cobertura de código (*code coverage*):

```bash
npx ng test --coverage
```

---

## 📦 Compilación para Producción

Para compilar y empaquetar la aplicación optimizada para producción:

```bash
npm run build
```
*(o alternativamente `npx ng build`)*

Los artefactos compilados y optimizados (con *hashing*, minificación y *tree-shaking*) se generarán en el directorio `dist/cocktail-bar/browser`.
