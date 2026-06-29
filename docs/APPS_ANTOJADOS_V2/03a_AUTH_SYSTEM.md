# 03a — Auth System

Version: 1.0.0
Status: baseline
Applies to: shared/api/services/auth/, shared/api/composables/useAuth.ts

## 1. Proposito

Define el sistema de autenticacion y sesion de las apps. Este sistema es el
primer punto de contacto del usuario con la app.

## 2. Contrato del Servicio

(Ver 02b_API_SERVICES_CONTRACT.md > Seccion 7 para detalle de endpoints)

**Nota**: Tras DEBT-001, `AuthService` delega sesion a `SessionService` y perfil a `ProfileService`.
Las firmas publicas se mantienen identicas para no romper compatibilidad.

```typescript
class AuthService {
  constructor(private readonly http: AxiosInstance = httpClient)

  // Registro
  async registerSocial(input: SocialRegisterInput): Promise<TragonSession>
  async registerSponsor(input: SponsorRegisterInput): Promise<TragonSession>
  async registerEmployee(input: EmployeeRegisterInput): Promise<TragonSession>

  // Login
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>>
  async loginShared(input: LoginRequest): Promise<LoginResponse>

  // Perfil (delegado a ProfileService)
  async profile(userId: string, emailHint?: string): Promise<ApiResponse<AuthUserProfile>>
  async getProfile(userId: string): Promise<AuthUser>
  async updateProfile(userId: string, payload: AuthProfileUpdateInput): Promise<ApiResponse<AuthUserProfile>>

  // Recuperacion de contrasena
  async requestPasswordRecovery(input: PasswordRecoveryRequestInput): Promise<ApiResponse<PasswordRecoveryRequestResult>>
  async verifyPasswordRecovery(input: PasswordRecoveryVerifyInput): Promise<ApiResponse<{ verified: boolean }>>
  async resetPasswordRecovery(input: PasswordRecoveryResetInput): Promise<ApiResponse<{ reset: boolean }>>

  // Sesion (delegado a SessionService)
  async setSession(session: TragonSession): Promise<void>
  async getSession(): Promise<TragonSession | null>
  async clearSession(): Promise<void>
  async getAccessToken(): Promise<string | null>
  async getRefreshToken(): Promise<string | null>
  async getTokens(): Promise<AuthTokens>
}
```

### Servicios delegados

#### SessionService (`shared/api/services/auth/session.service.ts`)

Maneja exclusivamente la sesion persistente:

```typescript
export class SessionService {
  async setSession(session: TragonSession): Promise<void>
  async getSession(): Promise<TragonSession | null>
  async clearSession(): Promise<void>
  async getAccessToken(): Promise<string | null>
  async getRefreshToken(): Promise<string | null>
  async getTokens(): Promise<AuthTokens>
  async buildSession(input: BuildSessionInput): Promise<TragonSession>
  async resolveSessionContext(userId: string, preferredType?: 'user' | 'sponsor'): Promise<AuthContextResolution>
}
```

#### ProfileService (`shared/api/services/auth/profile.service.ts`)

Maneja exclusivamente el perfil de usuario:

```typescript
export class ProfileService {
  async profile(userId: string, emailHint?: string): Promise<ApiResponse<AuthUserProfile>>
  async getProfile(userId: string): Promise<AuthUser>
  async updateProfile(userId: string, payload: AuthProfileUpdateInput): Promise<ApiResponse<AuthUserProfile>>
}
```

## 3. Funciones Exportadas

El servicio expone dos funciones de alto nivel:

```typescript
export async function login(input: LoginRequest): Promise<LoginResponse>
export async function getProfile(userId: string): Promise<AuthUser>
```

## 4. Tipos Principales

```typescript
interface TragonSession {
  userId: string
  email: string
  displayName: string | null
  username: string | null
  instanceType: 'user' | 'sponsor'
  domainContext: 'user' | 'sponsor'
  instanceId: string | null
  tenantUserId: string | null
  placeId: string | null
  cityCode: string | null
}

interface LoginResponse {
  session: TragonSession
  user: AuthUserProfile
  accessToken: string | null
  refreshToken: string | null
}

interface AuthUserProfile {
  id: string
  userId: string
  email: string
  name: string
  username: string | null
  cityCode: string | null
  avatarUrl: string | null
  bio: string | null
  // ... redes sociales, metricas, roles
}

interface AuthUser {
  userId: string
  email: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
  instanceType: string | null
  instanceId: string | null
  tenantUserId: string | null
  placeId: string | null
  cityCode: string | null
}
```

## 5. Seguridad

- Las contrasenas **nunca** viajan en texto plano
- Se envia `password_secret_ref` (SHA-256 de la contrasena)
- El email se envia como `email_hash` (SHA-256) ademas del email plano
- Los tokens se almacenan en `token.storage` (no localStorage)
- La sesion se almacena en `secure-storage` (Capacitor Preferences)
- El refresh token automatico es manejado por los interceptors HTTP

## 6. Flujo de Resolucion de Contexto (Sponsor vs User)

Despues del login, el sistema resuelve si el usuario es sponsor o user:

```
1. GET /api/v1/antojados/instancias/me?user_id=X&instance_type=sponsor
   → Si existe: el usuario tiene instancia sponsor
2. GET /api/v1/antojados/equipo/my-tenant?user_id=X
   → Si existe: el usuario es tenant de un sponsor
3. Se determina domainContext (sponsor | user)
4. Se guarda en la sesion
```

## 7. Composable useAuth

```typescript
function useAuth(): {
  session: Ref<TragonSession | null>
  user: Ref<AuthUserProfile | null>
  isAuthenticated: ComputedRef<boolean>
  isLoading: Ref<boolean>
  login(credentials: LoginCredentials): Promise<void>
  logout(): Promise<void>
  refreshProfile(): Promise<void>
}
```

## 8. Flujo Completo de Autenticacion

```
1. App inicia
2. Se verifica si hay sesion almacenada (getSession)
3. Si hay sesion, se carga el perfil
4. Si no hay sesion, se muestra pantalla de login
5. Usuario ingresa credenciales
6. login() → API valida → devuelve tokens + perfil
7. Tokens se almacenan en token.storage
8. Sesion se construye y almacena en secureStorage
9. Se resuelve contexto (sponsor vs user)
10. Se redirige al feed correspondiente
```

## 9. Reglas No Negociables

- Las contrasenas nunca viajan en texto plano (siempre SHA-256)
- La sesion siempre se persiste en secureStorage (nunca localStorage)
- El token de acceso se renueva automaticamente via interceptors
- El cierre de sesion limpia tokens, sesion y cache de GT
- El perfil del usuario se puede actualizar sin cerrar sesion

## 10. ⚠️ Deuda Tecnica Identificada (actualizado tras DEBT-001)

- **RESUELTO**: `auth.service.ts` separado en 3 servicios (DEBT-001): `auth.service.ts` (login/register/recovery, ~298 L), `session.service.ts` (sesion, ~200 L), `profile.service.ts` (perfil, ~50 L)
- **PENDIENTE**: `registerAccount()` privada aun maneja 3 tipos de registro con logica condicional. Refactorizar a metodos separados.
- **PENDIENTE**: `resolveSessionContext()` hace 3 llamadas API secuenciales. Unificar en un solo endpoint.
- **PENDIENTE**: No hay bloqueo de cuenta por intentos fallidos de login.

## 11. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial |
| 1.1.0 | 28/06/2026 | Actualizado tras DEBT-001: separacion en auth.service.ts + session.service.ts + profile.service.ts |

