# Apps Antojados V2 — Documentación Oficial

Version: 2.0.0
Status: baseline completo
Scope: Android New, iOS, Shared (api, http, ui), SQL, Build

## Proposito

Este documento es el indice maestro de la documentacion oficial de las apps
moviles V2 de AntojadosMX. Sigue la misma metodologia que ATLX Media Engine V3:

- Contratos estrictos por sistema
- Reglas no negociables (guardrails)
- Limites claros de responsabilidad
- Prohibiciones explicitas

## Estructura

```
docs/APPS_ANTOJADOS_V2/
├── 00_README.md                          ← Este archivo (indice)
├── 01_ARCHITECTURE_SPEC.md               ← Vision general del ecosistema Apps
├── 02_SHARED_SYSTEMS.md                  ← Contratos de la capa compartida
│   ├── 02a_HTTP_CLIENT_CONTRACT.md       ← Cliente HTTP, interceptors, auth
│   ├── 02b_API_SERVICES_CONTRACT.md      ← Servicios, endpoints, mappers, resolvers
│   ├── 02c_COMPONENT_BASE_CONTRACT.md    ← Componentes base Vue
│   ├── 02d_DIMENSIONS_LOCATIONS_CONTRACT.md ← Sistema dimensions/locations
│   ├── 02e_GEO_SYSTEM_CONTRACT.md        ← Sistema geo
│   ├── 02f_THEME_STYLES_CONTRACT.md      ← Temas y estilos
│   └── 02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md ← Integracion con Media Engine V3
├── 03_CORE_SYSTEMS.md                    ← Sistemas core de las apps
│   ├── 03a_AUTH_SYSTEM.md               ← Autenticacion y sesion
│   ├── 03b_FEED_SYSTEM.md               ← Feeds sociales y de negocio
│   ├── 03c_PUBLISH_SYSTEM.md            ← Publicacion de posts
│   ├── 03d_SPONSOR_SYSTEM.md            ← Patrocinios y biz
│   └── 03e_GT_INTEGRATION.md            ← Integracion con GT
├── 04_DEPLOY_REFERENCE.md               ← Referencia de versiones y deploy
├── 05_GUARDRAILS_FOR_CODEX.md           ← Reglas no negociables
├── 06_DEVELOPER_CHECKLIST.md            ← Checklist para desarrollo
├── 07_CHANGELOG.md                      ← Historial de cambios
├── 08_TECHNICAL_DEBT.md                 ← Catalogo de deuda tecnica
├── 09_DATABASE_SCHEMA.md                ← Esquema SQL y violaciones
└── 10_BUILD_AND_RELEASE.md              ← Build AAB, IPA, APK, TestFlight
```

## Estado de los contratos

| Contrato | Estado |
|---|---|
| 00_README.md | ✅ Hecho |
| 01_ARCHITECTURE_SPEC.md | ✅ Hecho |
| 02a_HTTP_CLIENT_CONTRACT.md | ✅ Hecho |
| 02b_API_SERVICES_CONTRACT.md | ✅ Hecho |
| 02c_COMPONENT_BASE_CONTRACT.md | ✅ Hecho |
| 02d_DIMENSIONS_LOCATIONS_CONTRACT.md | ✅ Hecho |
| 02e_GEO_SYSTEM_CONTRACT.md | ✅ Hecho |
| 02f_THEME_STYLES_CONTRACT.md | ✅ Hecho |
| 02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md | ✅ Hecho |
| 03a_AUTH_SYSTEM.md | ✅ Hecho |
| 03b_FEED_SYSTEM.md | ✅ Hecho |
| 03c_PUBLISH_SYSTEM.md | ✅ Hecho |
| 03d_SPONSOR_SYSTEM.md | ✅ Hecho |
| 03e_GT_INTEGRATION.md | ✅ Hecho |
| 04_DEPLOY_REFERENCE.md | ✅ Migrado desde legacy |
| 05_GUARDRAILS_FOR_CODEX.md | ✅ Hecho |
| 06_DEVELOPER_CHECKLIST.md | ✅ Hecho |
| 07_CHANGELOG.md | ✅ Hecho |
| 08_TECHNICAL_DEBT.md | ✅ Hecho |
| 09_DATABASE_SCHEMA.md | ✅ Hecho |
| 10_BUILD_AND_RELEASE.md | ✅ Hecho |

**21/21 contratos completados**

## Como usar

1. Leer este indice para entender el alcance
2. Ir al contrato especifico del sistema a modificar
3. Respetar los guardrails definidos en 05_GUARDRAILS_FOR_CODEX.md
4. Seguir el checklist en 06_DEVELOPER_CHECKLIST.md
5. Antes de modificar codigo o BD, revisar 08_TECHNICAL_DEBT.md y 09_DATABASE_SCHEMA.md
6. Para builds, seguir 10_BUILD_AND_RELEASE.md
7. Registrar cambios en 07_CHANGELOG.md
