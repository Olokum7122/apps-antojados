# 02a — HTTP Client Contract

Version: 1.0.0
Status: baseline
Applies to: shared/http/

## 1. Proposito

Define la arquitectura, configuracion y comportamiento del cliente HTTP
que usan todas las apps de AntojadosMX V2 para comunicarse con la API.

## 2. Principio

El cliente HTTP es la unica capa de comunicacion con el backend.
Ningun componente, servicio o composable debe crear instancias de `axios`
directamente. Todo pasa por `httpClient`.

## 3. Arquitectura

```
shared/http/
├── index.ts                    ← Barril: exporta httpClient, API_ENDPOINTS, helpers
├── client.ts                   ← Creacion de la instancia axios (unica)
├── interceptors.ts             ← Interceptors de request y response
├── endpoints.ts                ← Definicion centralizada de rutas API
└── config/
    └── api.ts                  ← Config: baseURL, timeout, env vars
```

## 4. Cliente HTTP (client.ts)

Crea una unica instancia de axios con:

```typescript
export const httpClient = setupHttpInterceptors(
  axios.create({
    baseURL: apiConfig.apiUrl,
    timeout: apiConfig.apiTimeout,
    headers: { Accept: 'application/json' },
  }),
)
```

- `baseURL` se obtiene de `VITE_API_URL` (entorno)
- `timeout` se obtiene de `VITE_API_TIMEOUT` (default: 30000ms)
- Los interceptors se aplican via `setupHttpInterceptors()`

## 5. Interceptors

### Request interceptor

Se ejecuta antes de cada peticion:

1. Agrega headers base:
   - `Accept: application/json`
   - `X-App-Version` (de VITE_APP_VERSION)
   - `X-App-Env` (de VITE_APP_ENV)
   - `X-Device-Platform` (de Capacitor.getPlatform(): "ios" | "android")
   - `Content-Type: application/json` (solo en POST, PUT, PATCH, DELETE)
2. Si hay token de acceso, agrega `Authorization: Bearer {token}`
3. El token se obtiene de `token.storage` (getAccessToken())

### Response interceptor

Se ejecuta despues de cada respuesta:

1. Si la respuesta es exitosa (2xx), la pasa sin cambios
2. Si la respuesta es 401 (no autorizado):
   - Marca la request como "_retry = true" para evitar loops
   - Intenta refrescar el token via `refreshAccessToken()`
   - Si el refresh es exitoso: re-intenta la request original con el nuevo token
   - Si el refresh falla: llama a `logoutHandler` y rechaza el error

### Refresh Token

- Solo funciona si `VITE_AUTH_REFRESH_PATH` esta configurado
- Usa `getRefreshToken()` para obtener el refresh token almacenado
- Hace POST a la ruta configurada con `{ refresh_token: ... }`
- Si la respuesta contiene nuevo accessToken, lo almacena
- Mecanismo anti-thundering herd: solo un refresh a la vez (refreshPromise)

### Logout Handler

```typescript
setHttpLogoutHandler(() => { ... })
```

Se ejecuta automaticamente cuando:
- El refresh token falla (ya no es valido)
- El usuario cierra sesion explicitamente

## 6. Endpoints (endpoints.ts)

Archivo unico que define TODAS las rutas de la API.

Formato:
```typescript
export const API_ENDPOINTS = {
  dominio: {
    accion: '/api/v1/antojados/{dominio}/{accion}',
    detalle: (id: string) => `/api/v1/antojados/{dominio}/${encodeURIComponent(id)}`,
  },
} as const
```

Reglas:
- Todas las rutas empiezan con `/api/v1/antojados/`
- Los parametres de ruta se construyen con funciones flecha
- Cada funcion usa `encodeURIComponent()` para sanitizar IDs
- El objeto es `as const` para type-safety

## 7. Configuracion (config/api.ts)

```typescript
export interface ApiConfig {
  apiUrl: string        // De VITE_API_URL
  appEnv: string        // De VITE_APP_ENV
  appVersion: string    // De VITE_APP_VERSION
  apiTimeout: number    // De VITE_API_TIMEOUT
  refreshPath: string   // De VITE_AUTH_REFRESH_PATH
}
```

- `normalizeUrl()` limpia la URL de hash/query/final slash
- `assertApiConfigured()` verifica que `VITE_API_URL` este configurado al inicio

## 8. Manejo de Errores

Todos los errores se normalizan a `ApiError`:

```typescript
interface ApiError {
  status: number
  message: string
  code?: string
  details?: Record<string, unknown> | null
}
```

Función `normalizeApiError()`:
- Extrae `message` del response (busca en `message`, `error` o `detail`)
- Preserva `code` y `details` si existen
- Si no hay response, usa el mensaje de axios

## 9. Variables de Entorno

```env
VITE_API_URL=http://185.187.235.253:8010
VITE_APP_ENV=development
VITE_APP_VERSION=0.0.1
VITE_API_TIMEOUT=30000
VITE_AUTH_REFRESH_PATH=
VITE_MEDIA_ENGINE_URL=http://localhost:4100
```

## 10. Reglas No Negociables

- Solo debe existir UNA instancia de `httpClient`
- Ningun componente debe importar `axios` directamente
- Ningun servicio debe crear su propio `axios.create()`
- Los interceptors no deben modificarse sin actualizar este contrato
- Todas las rutas deben estar en `endpoints.ts`, nunca hardcodeadas
- Los errores deben normalizarse via `normalizeApiError()`, no con try/catch en cada servicio

## 11. Prohibiciones

- No modificar los interceptors sin entender el flujo completo de auth
- No deshabilitar el interceptor de refresh token
- No agregar headers personalizados sin documentarlos aqui
- No usar `axios` directamente en componentes Vue
- No ignorar errores HTTP silenciosamente (siempre propagar o manejar explicitamente)

## 12. Dependencias

- `axios` — Cliente HTTP
- `@capacitor/core` — Para detectar plataforma (ios/android)
- `@antojados/api/storage` — Para almacenamiento de tokens

## 13. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial |
