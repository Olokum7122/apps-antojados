import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'

const EFIRMA_ACCEPTED_KEY_PREFIX = 'michamba:efirma:accepted:'

export interface EfirmaSignature {
  signature_id: string | null
  instance_id: string | null
  representative_tenant_user_id: string | null
  lifecycle_state: string | null
  activated_at: string | null
  revoked_at: string | null
  updated_at: string | null
}

export interface EfirmaActivation {
  activation_id: string | null
  signature_id: string | null
  instance_id: string | null
  activation_state: string | null
  channel: string | null
  expires_at: string | null
  opened_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  created_at: string | null
}

export interface EfirmaAuthorization {
  authorization_id: string | null
  signature_id: string | null
  instance_id: string | null
  requested_by_tenant_user_id: string | null
  operation_id: string | null
  action_code: string | null
  resource_type: string | null
  resource_id: string | null
  authorization_state: string | null
  authorized_at: string | null
  rejected_at: string | null
  expires_at: string | null
  created_at: string | null
}

export interface EfirmaAcceptedUsage {
  accepted: boolean
  accepted_at: string
  instance_id: string
  activation_id: string | null
  signature_id: string | null
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function storageKey(instanceId: string): string {
  return `${EFIRMA_ACCEPTED_KEY_PREFIX}${String(instanceId || '').trim()}`
}

export function getEfirmaAcceptedUsage(instanceId: string): EfirmaAcceptedUsage | null {
  if (!instanceId) return null
  const value = readJson<EfirmaAcceptedUsage>(storageKey(instanceId))
  return value?.accepted === true ? value : null
}

export function hasEfirmaAcceptedUsage(instanceId: string): boolean {
  return getEfirmaAcceptedUsage(instanceId)?.accepted === true
}

function setEfirmaAcceptedUsage(instanceId: string, value: EfirmaAcceptedUsage): void {
  localStorage.setItem(storageKey(instanceId), JSON.stringify(value))
}

export class EfirmaService {
  constructor(private readonly http: AxiosInstance) {}

  async getStatus(instanceId: string): Promise<{ signature: EfirmaSignature | null; last_activation: EfirmaActivation | null }> {
    const { data } = await this.http.get<{
      signature?: EfirmaSignature | null
      last_activation?: EfirmaActivation | null
    }>(API_ENDPOINTS.efirma.status, {
      params: { instance_id: instanceId },
    })
    return {
      signature: data.signature || null,
      last_activation: data.last_activation || null,
    }
  }

  async sendActivation(input: {
    instanceId: string
    actorTenantUserId: string
  }): Promise<{ activation: EfirmaActivation | null; activationToken: string | null }> {
    const { data } = await this.http.post<{
      activation?: EfirmaActivation | null
      activation_token?: string | null
    }>(API_ENDPOINTS.efirma.sendActivation, {
      instance_id: input.instanceId,
      actor_tenant_user_id: input.actorTenantUserId,
    })
    return {
      activation: data.activation || null,
      activationToken: data.activation_token || null,
    }
  }

  async acceptActivation(input: {
    instanceId: string
    activationId: string
    actorTenantUserId: string
    credentialValidated: boolean
  }): Promise<{ signature: EfirmaSignature | null; activation: EfirmaActivation | null }> {
    const { data } = await this.http.post<{
      signature?: EfirmaSignature | null
      activation?: EfirmaActivation | null
    }>(API_ENDPOINTS.efirma.acceptActivation, {
      instance_id: input.instanceId,
      activation_id: input.activationId,
      actor_tenant_user_id: input.actorTenantUserId,
      credential_validated: input.credentialValidated,
    })

    setEfirmaAcceptedUsage(input.instanceId, {
      accepted: true,
      accepted_at: new Date().toISOString(),
      instance_id: input.instanceId,
      activation_id: data.activation?.activation_id || input.activationId,
      signature_id: data.signature?.signature_id || null,
    })

    return {
      signature: data.signature || null,
      activation: data.activation || null,
    }
  }

  async authorizeAction(input: {
    instanceId: string
    requestedByTenantUserId: string
    actionCode: string
    resourceType: string
    resourceId: string
    credentialValidated: boolean
  }): Promise<EfirmaAuthorization | null> {
    const { data } = await this.http.post<{ row?: EfirmaAuthorization | null }>(API_ENDPOINTS.efirma.authorizeAction, {
      instance_id: input.instanceId,
      requested_by_tenant_user_id: input.requestedByTenantUserId,
      action_code: input.actionCode,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      credential_validated: input.credentialValidated,
    })
    return data.row || null
  }
}
