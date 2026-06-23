import type { AxiosInstance } from 'axios'
import { API_ENDPOINTS } from '@antojados/http/endpoints'

export interface EquipoMiTenant {
  instanceId: string | null
  tenantUserId: string | null
  profileType: string | null
  isOwner: boolean
}

export interface EquipoUsuario {
  id: string
  tenantUserId: string
  userId: string | null
  displayName: string
  email: string | null
  phone: string | null
  profileId: string | null
  profileName: string | null
  profileType: string | null
  status: string
  createdAt: string | null
  rowType: 'user'
}

export interface EquipoPerfil {
  id: string
  name: string
  type: string | null
}

export interface EquipoInvitacion {
  id: string
  code: string
  inviteCode: string
  email: string | null
  phone: string | null
  profileId: string | null
  status: string
  createdAt: string | null
  rowType: 'invitation'
}

export interface EquipoAsignacion {
  locationId: string
  instanceId: string | null
  nodeLevel: string | null
  nodeKind: string | null
  code: string | null
  componentCode: string | null
  label: string
  sortOrder: number
  visible: boolean
  puedeLeer: boolean
  puedeEditar: boolean
  tenantUserId: string | null
  tenantInstanceId: string | null
}

function stringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text || null
}

function boolFrom(value: unknown): boolean {
  return value === true || Number(value || 0) === 1
}

function numberFrom(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapMiTenant(raw: Record<string, unknown>): EquipoMiTenant {
  return {
    instanceId: stringOrNull(raw.instance_id),
    tenantUserId: stringOrNull(raw.tenant_user_id),
    profileType: stringOrNull(raw.profile_type),
    isOwner: boolFrom(raw.is_owner),
  }
}

function mapUsuario(raw: Record<string, unknown>): EquipoUsuario {
  const id = stringOrNull(raw.tenant_user_id) || stringOrNull(raw.id) || ''
  return {
    id,
    tenantUserId: id,
    userId: stringOrNull(raw.user_id),
    displayName: stringOrNull(raw.display_name) || stringOrNull(raw.name) || stringOrNull(raw.email) || id,
    email: stringOrNull(raw.email),
    phone: stringOrNull(raw.phone) || stringOrNull(raw.phone_e164) || stringOrNull(raw.whatsapp_number),
    profileId: stringOrNull(raw.profile_id),
    profileName: stringOrNull(raw.profile_name),
    profileType: stringOrNull(raw.profile_type),
    status: stringOrNull(raw.status) || 'active',
    createdAt: stringOrNull(raw.created_at),
    rowType: 'user',
  }
}

function mapPerfil(raw: Record<string, unknown>): EquipoPerfil {
  return {
    id: stringOrNull(raw.profile_id) || stringOrNull(raw.id) || '',
    name: stringOrNull(raw.profile_name) || stringOrNull(raw.name) || '',
    type: stringOrNull(raw.profile_type) || stringOrNull(raw.type),
  }
}

function mapInvitacion(raw: Record<string, unknown>): EquipoInvitacion {
  const code = stringOrNull(raw.invite_code) || stringOrNull(raw.code) || ''
  return {
    id: stringOrNull(raw.invitation_id) || stringOrNull(raw.id) || code,
    code,
    inviteCode: code,
    email: stringOrNull(raw.invitee_email) || stringOrNull(raw.email),
    phone: stringOrNull(raw.invitee_phone_e164) || stringOrNull(raw.phone),
    profileId: stringOrNull(raw.profile_id),
    status: stringOrNull(raw.status) || 'invited',
    createdAt: stringOrNull(raw.created_at),
    rowType: 'invitation',
  }
}

function mapAsignacion(raw: Record<string, unknown>): EquipoAsignacion {
  const locationId = stringOrNull(raw.location_id) || ''
  const componentCode = stringOrNull(raw.component_code) || stringOrNull(raw.code)
  return {
    locationId,
    instanceId: stringOrNull(raw.instance_id),
    nodeLevel: stringOrNull(raw.node_level),
    nodeKind: stringOrNull(raw.node_kind),
    code: stringOrNull(raw.code),
    componentCode,
    label: stringOrNull(raw.label) || componentCode || locationId,
    sortOrder: numberFrom(raw.sort_order),
    visible: boolFrom(raw.visible),
    puedeLeer: boolFrom(raw.puede_leer),
    puedeEditar: boolFrom(raw.puede_editar),
    tenantUserId: stringOrNull(raw.tenant_user_id),
    tenantInstanceId: stringOrNull(raw.tenant_instance_id),
  }
}

export class EquipoService {
  constructor(private readonly http: AxiosInstance) {}

  async getMiTenant(userId: string): Promise<EquipoMiTenant> {
    const { data } = await this.http.get<Record<string, unknown>>(API_ENDPOINTS.equipo.myTenant, {
      params: { user_id: userId },
    })
    return mapMiTenant(data)
  }

  async getUsuarios(instanceId: string): Promise<EquipoUsuario[]> {
    const { data } = await this.http.get<Record<string, unknown>[]>(API_ENDPOINTS.equipo.usuarios, {
      params: { instance_id: instanceId },
    })
    return Array.isArray(data) ? data.map(mapUsuario) : []
  }

  async getPerfiles(instanceId: string): Promise<EquipoPerfil[]> {
    const { data } = await this.http.get<Record<string, unknown>[]>(API_ENDPOINTS.equipo.perfiles, {
      params: { instance_id: instanceId },
    })
    return Array.isArray(data) ? data.map(mapPerfil) : []
  }

  async getInvitacionesPendientes(instanceId: string): Promise<EquipoInvitacion[]> {
    const { data } = await this.http.get<Record<string, unknown>[]>(API_ENDPOINTS.equipo.invitaciones, {
      params: { instance_id: instanceId },
    })
    return Array.isArray(data) ? data.map(mapInvitacion) : []
  }

  async invitar(input: {
    instanceId: string
    createdBy: string
    email?: string | null
    phone?: string | null
    profileId?: string | null
    expiresHours?: number
  }): Promise<EquipoInvitacion> {
    const { data } = await this.http.post<Record<string, unknown>>(API_ENDPOINTS.equipo.invitar, {
      instance_id: input.instanceId,
      created_by: input.createdBy,
      invitee_email: input.email || null,
      invitee_phone_e164: input.phone || null,
      channel: 'whatsapp',
      profile_id: input.profileId || null,
      expires_hours: input.expiresHours || 72,
    })
    return mapInvitacion(data)
  }

  async updateInvitacion(input: { invitationId: string; email?: string | null; phone?: string | null }): Promise<void> {
    await this.http.patch(API_ENDPOINTS.equipo.invitacionDetalle(input.invitationId), {
      invitee_email: input.email || null,
      invitee_phone_e164: input.phone || null,
      channel: 'whatsapp',
    })
  }

  async deleteInvitacion(invitationId: string): Promise<void> {
    await this.http.delete(API_ENDPOINTS.equipo.invitacionDetalle(invitationId))
  }

  async updatePerfil(tenantUserId: string, profileId: string | null): Promise<void> {
    await this.http.patch(API_ENDPOINTS.equipo.usuarioPerfil(tenantUserId), { profile_id: profileId })
  }

  async revocarUsuario(tenantUserId: string): Promise<void> {
    await this.http.patch(API_ENDPOINTS.equipo.usuarioRevocar(tenantUserId))
  }

  async transferirAdmin(input: { instanceId: string; nuevoUserId: string }): Promise<void> {
    await this.http.post(API_ENDPOINTS.equipo.transferAdmin, {
      instance_id: input.instanceId,
      nuevo_user_id: input.nuevoUserId,
    })
  }

  async getAsignaciones(tenantUserId: string): Promise<EquipoAsignacion[]> {
    const { data } = await this.http.get<Record<string, unknown>[]>(API_ENDPOINTS.equipo.asignaciones(tenantUserId))
    return Array.isArray(data) ? data.map(mapAsignacion) : []
  }

  async setAsignaciones(tenantUserId: string, details: EquipoAsignacion[]): Promise<void> {
    await this.http.put(API_ENDPOINTS.equipo.asignaciones(tenantUserId), {
      details: details.map((item) => ({
        location_id: item.locationId,
        visible: item.visible,
        puede_leer: item.puedeLeer,
        puede_editar: item.puedeEditar,
      })),
    })
  }

  async seedAsignaciones(tenantUserId: string, force = false): Promise<void> {
    await this.http.post(API_ENDPOINTS.equipo.asignacionesSeed(tenantUserId), { force })
  }
}
