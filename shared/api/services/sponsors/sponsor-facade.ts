/**
 * SponsorFacade — Facade de alto nivel para operaciones orquestadas de Sponsor.
 *
 * DEBT-007: Unifica la lógica de sponsor dispersa entre:
 *   - sponsors.service.ts (setup, documentos, status)
 *   - equipo.service.ts (gestión de equipo)
 *   - efirma.service.ts (firma electrónica)
 *   - registro.service.ts (registro corporativo)
 *
 * NO reemplaza los servicios individuales. Cada servicio mantiene su
 * responsabilidad única. Este facade orquesta flujos multi-servicio.
 */
import type { AxiosInstance } from 'axios'
import * as sponsorsService from '@antojados/api/services/sponsors/sponsors.service'
import { EquipoService } from '@antojados/api/services/equipo/equipo.service'
import type { SponsorWorkspaceContext } from '@antojados/api/services/equipo/equipo.service'
import { EfirmaService } from '@antojados/api/services/efirma/efirma.service'
import type { EfirmaSignature, EfirmaActivation, EfirmaAuthorization } from '@antojados/api/services/efirma/efirma.service'
import type { SponsorInstanceStatus, SponsorDocumentUploadInput } from '@antojados/api/types/sponsor'

export interface SponsorFullSetupInput {
  instanceId: string
  userId: string
  businessPayload: Record<string, unknown>
  billingPayload: Record<string, unknown>
  representativePayload: Record<string, unknown>
}

export interface SponsorFullSetupResult {
  business: Record<string, unknown>
  billing: Record<string, unknown>
  representative: Record<string, unknown>
}

export interface SponsorEfirmaStatus {
  signature: EfirmaSignature | null
  lastActivation: EfirmaActivation | null
}

export class SponsorFacade {
  private equipoService: EquipoService
  private efirmaService: EfirmaService

  constructor(http: AxiosInstance) {
    this.equipoService = new EquipoService(http)
    this.efirmaService = new EfirmaService(http)
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  async getInstanceStatus(userId: string): Promise<SponsorInstanceStatus | null> {
    return sponsorsService.getSponsorInstanceStatus(userId)
  }

  // ─── Setup completo (orquestado) ──────────────────────────────────────────

  async fullSetup(input: SponsorFullSetupInput): Promise<SponsorFullSetupResult> {
    const [business, billing, representative] = await Promise.all([
      sponsorsService.setupSponsorBusiness(input.instanceId, input.userId, input.businessPayload),
      sponsorsService.setupSponsorBilling(input.instanceId, input.userId, input.billingPayload),
      sponsorsService.setupSponsorRepresentative(input.instanceId, input.userId, input.representativePayload),
    ])

    return { business, billing, representative }
  }

  async setupBusiness(
    instanceId: string,
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return sponsorsService.setupSponsorBusiness(instanceId, userId, payload)
  }

  async setupBilling(
    instanceId: string,
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return sponsorsService.setupSponsorBilling(instanceId, userId, payload)
  }

  async setupRepresentative(
    instanceId: string,
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return sponsorsService.setupSponsorRepresentative(instanceId, userId, payload)
  }

  // ─── Documentos ───────────────────────────────────────────────────────────

  async uploadDocument(input: SponsorDocumentUploadInput): Promise<Record<string, unknown>> {
    return sponsorsService.uploadSponsorDocument(input)
  }

  // ─── Equipo (delegado) ────────────────────────────────────────────────────

  async getWorkspace(userId: string): Promise<SponsorWorkspaceContext> {
    return this.equipoService.getSponsorWorkspace(userId)
  }

  async getTeam(instanceId: string) {
    const [usuarios, perfiles, invitaciones] = await Promise.all([
      this.equipoService.getUsuarios(instanceId),
      this.equipoService.getPerfiles(instanceId),
      this.equipoService.getInvitacionesPendientes(instanceId),
    ])

    return { usuarios, perfiles, invitaciones }
  }

  // ─── E-firma (delegado) ───────────────────────────────────────────────────

  async getEfirmaStatus(instanceId: string): Promise<SponsorEfirmaStatus> {
    const result = await this.efirmaService.getStatus(instanceId)
    return {
      signature: result.signature,
      lastActivation: result.last_activation,
    }
  }

  async sendEfirmaActivation(
    instanceId: string,
    actorTenantUserId: string,
  ) {
    return this.efirmaService.sendActivation({ instanceId, actorTenantUserId })
  }

  async acceptEfirmaActivation(input: {
    instanceId: string
    activationId: string
    actorTenantUserId: string
    credentialValidated: boolean
  }) {
    return this.efirmaService.acceptActivation(input)
  }

  async authorizeEfirmaAction(input: {
    instanceId: string
    requestedByTenantUserId: string
    actionCode: string
    resourceType: string
    resourceId: string
    credentialValidated: boolean
  }) {
    return this.efirmaService.authorizeAction(input)
  }
}
