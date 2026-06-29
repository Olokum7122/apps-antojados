# 03d — Sponsor System

Version: 1.0.0
Status: baseline
Applies to: shared/api/services/sponsors/

## 1. Proposito

Define el sistema de patrocinios y negocios (sponsors). Este sistema gestiona
el registro, configuracion y operacion de negocios dentro de la plataforma.

## 2. Servicio Sponsor

```typescript
class SponsorsService {
  async setupSponsor(input: SponsorSetupInput): Promise<SponsorSetupResult>
  async getExpediente(input: ExpedienteInput): Promise<ExpedienteResult>
  async updateSponsor(input: SponsorUpdateInput): Promise<void>
  async getSponsorByPlace(placeId: string): Promise<SponsorInfo>
}
```

## 3. Endpoints

| Metodo | Endpoint | Proposito |
|---|---|---|
| setupSponsor | POST /api/v1/antojados/biz/setup | Configurar negocio sponsor |
| getExpediente | GET /api/v1/antojados/biz/expediente | Obtener expediente del sponsor |
| updateSponsor | PATCH /api/v1/antojados/biz/sponsor | Actualizar datos del sponsor |
| getSponsorByPlace | GET /api/v1/antojados/places/:id/sponsor | Obtener sponsor por lugar |

## 4. Tipos Principales

```typescript
interface SponsorSetupInput {
  userId: string
  businessName: string
  bizType: string
  cityCode: string
  phone?: string
  // ...
}

interface SponsorInfo {
  sponsorId: string
  businessName: string
  bizType: string
  cityCode: string
  status: 'pending' | 'active' | 'inactive'
  // ...
}
```

## 5. Areas del Sponsor

El sponsor accede a "Mi Chamba" que incluye:

| Area | Servicio | Proposito |
|---|---|---|
| Registro | registro.service.ts | Registro del negocio |
| E-firma | efirma.service.ts | Firma electronica de contratos |
| Contrato | legal-documents/ | Gestion de documentos legales |
| Atencion | sponsors.service.ts | Atencion al cliente |
| Cuenta | sponsors.service.ts | Pagos y estado de cuenta |
| Modulos | modulos.service.ts | Gestion de modulos contratados |
| Tiles | sponsors.service.ts | Tiles publicitarios |
| Metricas | sponsors.service.ts | Metricas del negocio |
| Equipo | equipo.service.ts | Gestion de equipo de trabajo |

## 6. Perfil de Sponsor

El sponsor tiene acceso a funcionalidades que el usuario normal no tiene:
- Publicar en Vas Ir y Arre
- Gestionar equipo de trabajo
- Acceder a metricas del negocio
- Configurar modulos y tiles
- Firmar documentos electronicamente
- Gestionar acarreados (La Banda)

## 7. Integracion con GT

El sistema de sponsors esta ligado al GT (Control Operativo y Economico).
Cada sponsor tiene:
- `corp_instance_id` — Instancia corporativa en GT
- `program_instance_id` — Programa en GT
- `commission_profile_code` — Perfil de comisiones
- `economic_status` — Estado economico

## 8. Reglas No Negociables

- El registro de sponsor requiere verificacion de identidad
- Los sponsors deben tener un expediente completo antes de poder publicar
- Los sponsors solo pueden publicar en los canales que tienen contratados (modulos)
- El equipo de trabajo de un sponsor solo puede ser gestionado por el sponsor owner
- Las metricas del sponsor son privadas (solo visibles para el sponsor)

## 9. ⚠️ Deuda Tecnica Identificada

- El flujo de registro de sponsor tiene logica condicional en `auth.service.ts`
  que deberia estar en `sponsors.service.ts`.
- No hay un servicio unico de sponsor. La logica esta dispersa entre
  `auth.service.ts`, `sponsors.service.ts`, `equipo.service.ts`, `efirma.service.ts`.
  Propuesta: crear un facade `SponsorFacade` que orqueste todas las operaciones.
- ~~Las areas de Mi Chamba tienen rutas dentro de /antojo/* pero son semanticamente
  diferentes (sponsor vs consumidor). Deberian tener su propio modulo de rutas.~~ **NO PROCEDE** — Mi Chamba es parte integral del ecosistema Antojados-GT. Moverlo implicaria redisenar dimensions/locations, GT access rules, layouts y rutas redirect. Costo > beneficio.
- No hay validacion de que modulos tiene contratados el sponsor antes de
  mostrar las opciones en Mi Chamba.

## 10. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial |
