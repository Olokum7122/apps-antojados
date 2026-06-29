# 02f — Theme & Styles Contract

Version: 1.0.0
Status: baseline
Applies to: shared/ui/theme/, shared/ui/css/

## 1. Proposito

Define el sistema de temas y estilos de las apps. Cubre la gestion de temas
(Ambar, Aqua, Indigo), las variables CSS personalizadas (app-*) y los estilos
globales de Quasar.

## 2. Temas Disponibles

La app soporta 3 temas:

| Tema | Codigo | Descripcion |
|---|---|---|
| Ambar | ambar | Tema por defecto, tonos ambar/calidos |
| Aqua | aqua | Tono aqua/azul |
| Indigo | indigo | Tono indigo/purpura |

Los temas se gestionan via `themeManager.ts`:

```typescript
function getActiveTheme(): string        // Tema actual
function setTheme(theme: string): string  // Cambiar tema y persistir
function getAvailableThemes(): string[]   // Lista de temas disponibles
```

## 3. Variables CSS Personalizadas (app-*)

Las apps definen sus propias variables CSS (no solo las de Quasar):

```css
/* Colores base */
--app-bg-start:           #f5f0eb;
--app-bg-fixed:           #fffcf5;
--app-bg-card:            #ffffff;
--app-bg-clear:           transparent;
--app-text-primary:       #3d2e1c;
--app-text-secondary:     rgba(61, 46, 28, 0.65);
--app-text-accent:        #c8913b;
--app-border:             rgba(61, 46, 28, 0.12);
--app-accent-bg:          rgba(200, 145, 59, 0.08);
--app-scroll-thumb:       rgba(61, 46, 28, 0.25);

/* Barras (navbar, footer) */
--bar-bg-module:          #3d2e1c;
--bar-text-module:        rgba(255, 252, 245, 0.75);
--bar-active-text-module: #ffd78a;
--bar-border-module:      rgba(255, 255, 255, 0.08);
```

### Nomenclatura de variables

- `--app-*` — Variables propias de AntojadosMX (no de Quasar)
- `--bar-*` — Variables para barras de navegacion
- `--q-*` — Variables de Quasar (no modificables sin este contrato)

## 4. Estructura de Archivos CSS

```
shared/ui/css/
├── app.scss                  ← Estilos globales de la app
├── indexclasses.scss         ← Clases utilitarias indexadas
└── quasar.variables.scss     ← Override de variables de Quasar
```

### quasar.variables.scss

Define los colores primarios, secundarios y accent de Quasar para cada tema:

```scss
// Tema Ambar
$primary   : #c8913b;
$secondary : #3d2e1c;
$accent    : #e8b85a;

// Tema Aqua
// $primary   : #3ba6c8;
// $secondary : #1c3d3d;
// $accent    : #5ae8d6;

// Tema Indigo
// $primary   : #6b3bc8;
// $secondary : #2c1c3d;
// $accent    : #b85ae8;
```

### app.scss

Define las variables CSS personalizadas y estilos globales:
- Variables `--app-*` (cambiadas por tema)
- Estilos de scrollbar
- Estilos de tipografia base
- Overrides de Quasar cuando es necesario

## 5. Funcionamiento del Tema

```
1. App inicia
2. themeManager.getActiveTheme() — obtiene tema de secureStorage o "ambar"
3. Se aplican las variables CSS correspondientes en el root del documento
4. El usuario puede cambiar el tema via boton en el header
5. themeManager.setTheme("aqua") — cambia variables y persiste
```

El cambio de tema se hace modificando propiedades CSS del documento:

```typescript
document.documentElement.style.setProperty('--bar-bg-module', '#1c3d3d')
```

## 6. Reglas No Negociables

- Todos los colores de la app deben usar las variables CSS (nunca colores hardcodeados)
- Los temas deben usar las mismas variables, solo cambian los valores
- No se pueden agregar temas nuevos sin actualizar este contrato
- Los componentes base deben usar solo variables `--app-*` (nunca colores Quasar directamente)
- Los cambios de tema deben ser instantaneos (sin recarga de pagina)
- El tema seleccionado debe persistir entre sesiones

## 7. Prohibiciones

- No usar colores hex/rgb directamente en los componentes (siempre variables CSS)
- No modificar `quasar.variables.scss` sin entender el impacto en todos los temas
- No agregar variables CSS sin documentarlas aqui
- No usar estilos inline para colores que deberian ser variables
- No cambiar el tema basado en la hora del dia (solo por seleccion del usuario)

## 8. ⚠️ Deuda Tecnica Identificada

- Los temas Ambar, Aqua e Indigo estan definidos pero solo Ambar esta completo.
  Aqua e Indigo tienen variables comentadas en quasar.variables.scss.
  Propuesta: completar los 3 temas o eliminar los que no esten funcionando.
- El cambio de tema se hace modificando propiedades CSS directamente en el DOM.
  Propuesta: usar clases de CSS en el root element en lugar de inline styles.
- No hay un sistema de paleta de colores documentada. Las variables existen
  pero no hay un "brand book" que diga que color se usa para que proposito.
- Los estilos de scrollbar custom estan en app.scss pero no funcionan en todos
  los navegadores (solo WebKit).

## 9. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial. Sistema de temas y variables CSS |
