# 02b — API Services Contract

Version: 1.0.0
Status: baseline
Applies to: shared/api/services/

## 1. Proposito

Define la arquitectura, organización y contratos de la capa de servicios API
que consumen las apps AntojadosMX V2.

## 2. Principio

Los servicios son una capa delgada entre la UI y la API de Antojados.
Cada servicio encapsula las llamadas HTTP a un dominio especifico y expone
metodos tipados que los componentes Vue consumen directamente.

Los servicios **no** deben:
- Contener logica de negocio compleja (eso pertenece a la API)
- Mantener estado entre llamadas (son stateless)
- Acceder directamente al almacenamiento local (eso es responsabilidad de storage/)
- Procesar media (eso es responsabilidad del Media Engine)

## 3. Organizacion

```
shared/api/services/
├── index.ts                          ← Barril: exporta instancias compartidas
├── auth/
│   ├── auth.service.ts               ← Autenticacion, sesion, registro
│   └── auth-crypto.ts                ← Hash SHA-256 para credenciales
├── efirma/
│   └── efirma.service.ts             ← Firma electronica
├── equipo/
│   └── equipo.service.ts             ← Gestion de equipo/tenant
├── explorers/
│   └── explorers.service.ts          ← Programa exploradores
├── feed/
│   ├── biz-feed.service.ts           ← Feed de negocios (sponsors)
│   ├── mi-rollo.service.ts           ← Feed "Mi Rollo" personal
│   ├── social-actions.service.ts     ← Acciones sociales (likes, saves, follows)
│   └── social-feed.service.ts        ← Feed social general
├── geo/
│   └── geo.service.ts                ← Geolocalizacion y scopes
├── gt/
│   └── gt-access.service.ts          ← Control de acceso GT
├── legal-documents/                  ← Documentos legales
├── media/
│   ├── media.service.ts              ← Subida y consulta de media (usa engine)
│   └── media-publish-flow.service.ts ← Flujo de publicacion con media
├── media-engine/
│   └── mediaEngineClient.ts          ← Cliente HTTP del Media Engine V3
├── modulos/
│   ├── modulos.service.ts            ← Catalogos de modulos
│   └── modulos-transversal-bridge.ts ← Bridge transversal entre modulos
├── places/
│   └── places.service.ts             ← Lugares y Google Places
├── publish/
│   └── publish.service.ts            ← Creacion de posts
├── rankings/
│   └── rankings.service.ts           ← Rankings y metricas
├── registro/
│   └── registro.service.ts           ← Registro de usuarios
├── rewards/
│   └── rewards.service.ts            ← Campañas de recompensas
├── sponsors/
│   └── sponsors.service.ts           ← Patrocinios y biz setup
├── system/
│   └── system.service.ts             ← Systema (health, config)
├── tenants/
│   └── tenants.service.ts            ← Gestion de tenants (GT)
└── users/
    └── users.service.ts              ← Usuarios
```

## 4. Patron de Servicio

Cada servicio sigue este patron:

```typescript
import type { AxiosInstance } from 'axios'
import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'

export class MiService {
  constructor(private readonly http: AxiosInstance = httpClient) {}

  async miMetodo(input: MiInput): Promise<MiOutput> {
    const { data } = await this.http.post<TipoRespuesta>(
      API_ENDPOINTS.miDominio.miRuta,
      input,
    )
    return mapper(data)
  }
}
```

Reglas del patron:
- Inyectar `http` como dependencia (default: `httpClient` global)
- Usar `API_ENDPOINTS` para las rutas (nunca strings hardcodeadas)
- Tipar todas las entradas y salidas
- Los mappers van dentro del servicio o en el mismo archivo

## 5. Barril Central (index.ts)

El archivo `services/index.ts` exporta instancias compartidas de cada servicio
y re-exporta tipos. Los componentes importan desde `@antojados/api/services`:

```typescript
import { mediaService, publishService } from '@antojados/api/services'
```

## 6. Mapeo API Response → Tipos de App

Cada servicio contiene funciones mapper que transforman la respuesta cruda de
la API al formato que entienden los componentes. Ejemplo (de auth.service.ts):

```typescript
function mapProfile(raw: ProfileApiResponse, email: string): AuthUserProfile {
  return {
    id: String(raw.user_id),
    userId: String(raw.user_id),
    email,
    name: String(raw.display_name || '').trim() || email,
    username: raw.username || null,
    cityCode: raw.city_code || null,
    // ...
  }
}
```

Los mappers residen en el mismo archivo del servicio. No hay una carpeta
separada de mappers.

## 7. Flujo de Autenticacion

El servicio de auth (`auth.service.ts`) maneja:

| Metodo | Endpoint | Proposito |
|---|---|---|
| `registerSocial()` | POST /api/v1/antojados/auth/register | Registro de usuario social |
| `registerSponsor()` | POST /api/v1/antojados/auth/register | Registro de sponsor |
| `registerEmployee()` | POST /api/v1/antojados/auth/register-employee | Registro por invitacion |
| `login()` | POST /api/v1/antojados/auth/login | Inicio de sesion |
| `profile()` | GET /api/v1/antojados/auth/profile/:userId | Obtener perfil |
| `updateProfile()` | PATCH /api/v1/antojados/auth/profile/:userId | Actualizar perfil |
| `requestPasswordRecovery()` | POST /api/v1/antojados/auth/password-recovery/request | Solicitar recuperacion |
| `verifyPasswordRecovery()` | POST /api/v1/antojados/auth/password-recovery/verify | Verificar codigo |
| `resetPasswordRecovery()` | POST /api/v1/antojados/auth/password-recovery/reset | Restablecer contrasena |
| `setSession()` | — | Guarda sesion en secure storage |
| `getSession()` | — | Recupera sesion |
| `clearSession()` | — | Limpia sesion y tokens |

### Flujo de sesion

```
1. Login/Registro exitoso
2. API devuelve access_token + refresh_token
3. Se almacenan en token.storage
4. Se construye objeto TragonSession
5. Se guarda en secureStorage con clave "antojados.session"
6. Se verifica contexto (sponsor vs user) via endpoints /instance/me y /equipo/my-tenant
```

### Seguridad

- Las contrasenas **nunca** viajan en texto plano
- Se envia `password_secret_ref` (SHA-256 de la contrasena)
- El email se envia como `email_hash` (SHA-256) ademas del email plano
- Los tokens se almacenan en `token.storage` (no en localStorage directamente)
- La sesion se almacena en `secure-storage` (usa Capacitor Preferences o polyfill)

## 8. Flujo de Feeds

Tres tipos de feed:

| Servicio | Proposito |
|---|---|
| `social-feed.service.ts` | Feed social general (posts de usuarios) |
| `biz-feed.service.ts` | Feed de negocios/sponsors |
| `mi-rollo.service.ts` | Feed personalizado "Mi Rollo" |
| `social-actions.service.ts` | Acciones: follow, like, save |

Los feeds se consumen via composables especificos:
- `useAntojadosFeed.ts` — Feed social
- `useAntojoFeed.ts` — Feed de negocio
- `useSocialActionSync.ts` — Sincronizacion de acciones

## 9. Flujo de Publicacion

Ver contrato `02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md` para el flujo completo.

Resumen:
1. Usuario selecciona media (camara/galeria)
2. `usePublishMedia` composable captura el archivo como base64
3. `mediaService.uploadMedia()` ejecuta flujo Media Engine V3
4. `publishService.createSocialPost()` o `createBizPost()` crea el post con las URLs

## 10. Flujo de Media

Servicios involucrados:
- `media.service.ts` — Punto de entrada. Llama al engine y mapea respuesta
- `mediaEngineClient.ts` — Cliente HTTP del Media Engine V3
- `media-publish-flow.service.ts` — Orquesta publicacion con media

(Ver contrato 02g para detalle completo)

## 11. Servicios de GT

| Servicio | Proposito |
|---|---|
| `gt-access.service.ts` | Resolucion de acceso GT (metodo `resolveGtMetadataAccessSync`) |
| `gt-cache.service.ts` | Cache de acceso GT con TTL, suscripcion SSE, construccion de snapshot |
| `tenants.service.ts` | Gestion de tenants (instancias de negocio) |
| `modulos.service.ts` | Catalogos y operaciones de modulos |
| `modulos-transversal-bridge.ts` | Bridge entre modulos para operaciones cruzadas |

La separacion entre `gt-access.service.ts` y `gt-cache.service.ts` responde a DEBT-002:
- `gt-access.service.ts` solo contiene logica de resolucion de acceso (SRP)
- `gt-cache.service.ts` contiene cache, SSE, snapshot building, y TTL de 5 min (DEBT-027)

## 12. Endpoints Definidos

Definidos en `shared/http/endpoints.ts`. Agrupados por dominio:

| Grupo | Prefijo | Ejemplos |
|---|---|---|
| auth | `/api/v1/antojados/auth/` | login, register, profile, password-recovery |
| instance | `/api/v1/antojados/instancias/` | me/info |
| equipo | `/api/v1/antojados/equipo/` | usuarios, perfiles, invitar, asignaciones |
| sponsors | `/api/v1/antojados/biz/` | setup, expediente |
| tenants | `/api/v1/antojados/gt/tenants` | CRUD, expediente, review |
| places | `/api/v1/antojados/places` | list, search, detail, posts, ratings |
| geo | `/api/v1/antojados/geo` | scopes, cities, resolve |
| rankings | `/api/v1/antojados/` | top-places, analytics |
| media | `/api/v1/antojados/media/` | upload, intake (legacy, ya no usado) |
| efirma | `/api/v1/antojados/gt/efirma` | create, send-activation, authorize |
| modulos | `/api/v1/antojados/gt/instances/:id/modules` | catalog, operations, audit |
| gt | `/api/v1/antojados/gt/` | dimensions, templates, checked |
| bizPosts | `/api/v1/antojados/biz/` | posts, feed |
| socialPosts | `/api/v1/antojados/` | posts, feed, sync/events, social |
| rewards | `/api/v1/antojados/rewards/` | campaigns, redeem, redemptions |

## 13. Reglas No Negociables

- Todos los servicios deben usar `API_ENDPOINTS` para las rutas (nunca strings hardcodeadas)
- Todos los metodos deben estar tipados (input y output)
- Los servicios no deben acceder a `localStorage` o `sessionStorage` directamente
- Los servicios no deben mantener estado interno
- Los servicios no deben llamar a otros servicios directamente (usar composables para orquestar)
- Los mappers deben ser funciones puras (sin side effects)
- Los nombres de propiedades en los mappers usan camelCase (la API usa snake_case)

## 14. Prohibiciones

- No importar servicios desde componentes Vue directamente (usar composables)
- No crear instancias de servicios en componentes (usar las del barril)
- No modificar `endpoints.ts` sin actualizar este contrato
- No agregar logica de UI en los servicios
- No cachear respuestas en los servicios (usar composables para cache si es necesario)

## 15. Dependencias

- `axios` — Cliente HTTP subyacente
- `@antojados/http` — Capa HTTP con interceptors y config
- `@antojados/api/types` — Tipos compartidos
- `@antojados/api/storage` — Almacenamiento seguro de tokens y sesion

## 16. Variables de Entorno

```env
VITE_API_URL=http://185.187.235.253:8010
VITE_API_TIMEOUT=30000
VITE_AUTH_REFRESH_PATH=
```

## 17. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial. Mapeo de todos los servicios, endpoints y flujos |
