# Onboarding Package — Fase 3: Corrección de Deuda Técnica

Este documento es el resumen ejecutivo que necesitas para arrancar la Fase 3
sin errores de contexto. Léelo completo antes de tocar código.

## Qué vamos a hacer

Corregir la deuda técnica prioritaria de Apps Antojados V2 para que las apps
corran excelentemente en Play Store y App Store.

## Estado Actual (completado)

### 🔴 Criticas (5/5 resueltas)
- DEBT-001 ✅ Separar auth.service.ts en 3 servicios
- DEBT-002 ✅ Separar gt-access.service.ts en 2 servicios
- DEBT-008 ✅ Cache de feed con invalidación por tiempo
- DEBT-020 ✅ Separar useLocationScope.ts en 4 módulos helper
- DEBT-038 ✅ Componentes de feed usan variantes correctas del engine

### 🟡 Altas (10/14 resueltas, 1 no procede)
- DEBT-003 ✅ Eliminar métodos legacy de media.service.ts
- DEBT-004 ✅ Marcar endpoints legacy como @deprecated
- DEBT-005 ✅ Refactorizar registerAccount()
- DEBT-009 ✅ Límite de 50 páginas en scroll infinito
- DEBT-011 ✅ Refactorizar componentes base de feed (solo PublishFabBase violaba pureza)
- DEBT-013 ✅ Eliminar doble conversión base64
- DEBT-014 ✅ Crear composable usePublish() unificado
- DEBT-015 ✅ Validación de tamaño de archivo
- DEBT-022 ✅ Migrar eventos window a bus de Vue (eventBus)
- DEBT-025 ✅ TTL en cache de GT
- DEBT-031 ✅ Implementar getAccessInfo, hasModuleAccess, getRole
- DEBT-032 ✅ FeedPostCard usa stage prop para variante correcta
- DEBT-029 ❌ NO PROCEDE — Mi Chamba es parte integral del ecosistema Antojados-GT
- DEBT-010 ⬜ Pendiente — Métricas de rendimiento de carga
- DEBT-024 ⬜ Pendiente — Rate limiting en auth

### 🟢 Media (12 pendientes)
- DEBT-006: resolveSessionContext() hace 3 llamadas API secuenciales
- DEBT-007: No hay SponsorFacade unificado
- DEBT-012: Skeleton loaders en feed
- DEBT-016: Mensajes de error amigables para fallos del engine
- DEBT-017: Fallback en secure-storage.ts sin Capacitor
- DEBT-019: Nivel "metro" se normaliza a "zona" (confuso)
- DEBT-021: CITY_OPTIONS mutable exportada
- DEBT-022: Tema Aqua e Indigo incompletos
- DEBT-026: Rutas redirect legacy en /antojo/*
- DEBT-027: Catch-all route sin logging de 404s
- DEBT-028: Eventos de geo en MainLayout
- DEBT-033: mi-rollo.service.ts sin paginación explícita

### 🔵 Baja (2 pendientes)
- DEBT-023: Cambio de tema modifica CSS inline en DOM
- DEBT-030: GeoService sin fallback si navigator.geolocation no disponible

## Resumen
| Prioridad | Total | Resueltos | No Procede | Pendientes |
|---|---|---|---|---|
| 🔴 Critica | 5 | 5 | 0 | 0 |
| 🟡 Alta | 14 | 12 | 1 | 1 |
| 🟢 Media | 12 | 0 | 0 | 12 |
| 🔵 Baja | 2 | 0 | 0 | 2 |
| **Total** | **33** | **17** | **1** | **15** |

## Reglas que NO debes violar (de 05_GUARDRAILS_FOR_CODEX.md)

### Reglas de Arquitectura
- Los componentes Vue NO importan servicios API directamente
- Los composables son el único puente entre UI y servicios
- Solo existe UNA instancia de httpClient
- Los 3 tabs del footer son fijos (Antojo, Antojados, Tragon)
- La media siempre se sube via el Media Engine
- La sesión siempre se persiste en secureStorage

### Reglas de BD
- place_id SOLO pertenece a soc_places
- tenant_id SOLO se liga a sys_instancia
- city_code pertenece al contexto de sesión, no a auth

## Estructura de archivos clave

```
apps-antojados/
├── shared/
│   ├── api/
│   │   ├── services/
│   │   │   ├── auth/              ← auth.service.ts (~298L), session.service.ts (~200L), profile.service.ts (~50L)
│   │   │   ├── feed/              ← social-feed, biz-feed, mi-rollo, social-actions
│   │   │   ├── gt/                ← gt-access.service.ts (~196L), gt-cache.service.ts (~407L)
│   │   │   ├── media/             ← media.service.ts (con fallback lazy)
│   │   │   ├── publish/           ← publish.service.ts, usePublish.ts
│   │   │   ├── sponsors/          ← sponsors.service.ts
│   │   │   └── index.ts           ← Barril de servicios
│   │   ├── composables/
│   │   │   ├── useLocationScope.ts ← ~230L (separado en geo/)
│   │   │   ├── geo/               ← geo-state.ts, geo-helpers.ts, geo-device.ts, geo-city.ts
│   │   │   ├── useAntojadosFeed.ts
│   │   │   ├── useAntojoFeed.ts
│   │   │   ├── usePublishMedia.ts
│   │   │   ├── usePublish.ts      ← Unificado (DEBT-014)
│   │   │   └── useAuth.ts
│   │   └── types/
│   │       ├── auth.ts
│   │       ├── feed.ts
│   │       ├── location.ts
│   │       └── publish.ts
│   ├── http/
│   │   ├── client.ts
│   │   ├── endpoints.ts           ← endpoints legacy @deprecated (DEBT-004)
│   │   └── interceptors.ts
│   └── ui/
│       ├── base/                  ← 21 componentes base (puros)
│       │   └── useFabAccess.ts    ← Nuevo (DEBT-011)
│       ├── services/
│       │   └── eventBus.ts        ← Nuevo (DEBT-022)
│       ├── dimensions/            ← navigationDimensions.js
│       ├── theme/                 ← themeManager.ts, estilos
│       └── app/
│           ├── layouts/
│           │   └── MainLayout.vue ← usa eventBus (DEBT-022)
│           ├── router/
│           │   └── routes.js
│           └── pages/
└── docs/
    └── APPS_ANTOJADOS_V2/         ← 21 contratos de referencia
```

## Tests mínimos antes de cada PR
1. TypeScript compila sin errores
2. Las rutas funcionan correctamente
3. El feed carga en menos de 3 segundos
4. Las imágenes cargan lazy
5. Los estados de carga/error/vacío se muestran
6. No hay console.logs de debug
7. El código sigue los guardrails

## Referencias rápidas

### Endpoints API
Base URL: http://185.187.235.253:8010/api/v1/antojados/

| Dominio | Prefijo |
|---|---|
| auth | /auth/ |
| social | /social/ |
| biz | /biz/ |
| geo | /geo/ |
| media | /media/ |
| gt | /gt/ |
| instance | /instancias/ |
| equipo | /equipo/ |

### Tipos de cuenta
- user → registro social normal
- sponsor → negocio con workspace
- tenant → ligado a sys_instancia, no a otra tabla

### Tipos de feed
- Social: barrio, pachanga, la-neta, desma
- Biz: vas_ir, arre
- Personal: mi-rollo

