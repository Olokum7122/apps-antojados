# 05 — Guardrails for Codex

Version: 1.1.0
Status: updated

## 1. Proposito

Define las reglas no negociables para el desarrollo de apps AntojadosMX V2.
Estas reglas deben ser respetadas por cualquier desarrollador (humano o AI)
que modifique el codigo. Violar estas reglas es violar la arquitectura.

## 2. Reglas de Arquitectura

### 2.1 Capas
- Los componentes Vue NO deben importar servicios API directamente
- Los componentes Vue NO deben crear instancias de axios
- Los componentes Vue NO deben usar `localStorage` o `sessionStorage`
- Los servicios NO deben importar componentes Vue
- Los servicios NO deben mantener estado interno entre llamadas
- Los composables son el unico puente entre UI y servicios

### 2.2 HTTP
- Solo debe existir UNA instancia de httpClient
- Todas las rutas API deben estar en endpoints.ts
- Ningun archivo fuera de shared/http/ debe importar axios
- Los interceptors no deben modificarse sin entender el flujo completo de auth
- No deshabilitar el interceptor de refresh token

### 2.3 Navegacion
- Los 3 tabs del footer (Antojo, Antojados, Tragon) son fijos
- No agregar tabs al footer sin aprobacion arquitectonica
- No modificar MAIN_TABS sin actualizar MainLayout
- No crear rutas fuera del router de Vue

### 2.4 Media
- La media siempre se sube via el Media Engine (nunca directo a la API)
- Las apps nunca procesan media localmente (solo el engine)
- El post no se crea hasta que la media esta processada (status: ready)
- No exponer estados internos del engine al usuario
- **El registro de derechos y origen (rights-origin) SIEMPRE debe ejecutarse antes de uploadOriginal** (contrato 02g §5.2)
- **Las apps deben usar las variantes especificas del ready-payload segun contexto: thumb (S1/grid), feed (S2/tarjetas), full (S3/fullscreen), videoUrl (video feed)**
- **Las apps nunca pasan `media_url` directo al crear posts. Usar `media_intake_id` para que el Gateway resuelva la URL final** (Contrato API Central §9.4)

### 2.5 Sesion y Auth
- La sesion siempre se persiste en secureStorage (nunca localStorage)
- Las contrasenas nunca viajan en texto plano
- El cierre de sesion limpia tokens, sesion y cache de GT
- El contexto (sponsor vs user) se resuelve siempre al hacer login

## 3. Reglas de Codigo

### 3.1 TypeScript
- Todos los inputs y outputs de funciones deben estar tipados
- No usar `any` (si es necesario, documentar por que)
- Los mappers deben ser funciones puras (sin side effects)
- Usar `as const` para constantes y enumeraciones

### 3.2 Nombres
- Props en camelCase
- Eventos en kebab-case (o usar `update:modelValue`)
- Variables CSS con prefijo `--app-*`
- Codigos de dimension en MAYUSCULAS con puntos (ANTOJO.VAS_IR)

### 3.3 Estilos
- Usar siempre variables CSS, nunca colores hardcodeados
- Los componentes base deben usar scoped styles
- No modificar CSS global fuera de shared/ui/css/

### 3.4 Componentes
- Los componentes base NO deben importar servicios API
- Los componentes base NO deben usar useRouter o useRoute (recibir via props)
- Los componentes base NO deben tener estado global
- Los componentes base deben tener props y emits tipados

## 4. Reglas de Datos

### 4.1 API
- Las rutas API siempre usan API_ENDPOINTS (nunca strings hardcodeadas)
- Los endpoints legacy deben marcarse como @deprecated
- No cachear respuestas en los servicios (usar composables para cache)

### 4.2 Geo
- La ubicacion siempre se resuelve via la API (nunca hardcodeada)
- Las coordenadas GPS no se almacenan (solo ciudad/scope)
- No hacer polling de ubicacion (solo foreground o interaccion)

## 5. Reglas de Rendimiento

- El feed debe cargar en menos de 3 segundos en 4G
- Scroll infinito: maximo 50 paginas en memoria
- Las imagenes deben cargarse lazy
- Los videos deben tener autoplay en silent mode
- No cargar todo el feed de una sola vez (siempre paginado)

## 6. Reglas para Codex (AI)

- Al generar codigo nuevo, respetar la estructura de capas existente
- No crear archivos fuera de las carpetas establecidas
- No modificar un contrato sin actualizar este documento
- Si un cambio requiere modificar un contrato, documentarlo primero
- Si hay duda sobre donde poner algo, preguntar al usuario

## 7. Penalizaciones

- Violar una regla de arquitectura (2.x) = refactor obligatorio
- Violar una regla de codigo (3.x) = corregir en el mismo PR
- Violar una regla de datos (4.x) = revertir el cambio
- Violar una regla de rendimiento (5.x) = optimizar antes de merge

## 8. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Version inicial |
