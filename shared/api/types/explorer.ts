export interface Explorer {
  userId: string
  displayName?: string | null
  username?: string | null
  cityCode?: string | null
  status?: string | null
  raw: Record<string, unknown>
}

export interface ExplorerAssociation {
  associationId: string
  userId: string
  targetType?: string | null
  associatedInstanceId?: string | null
  status?: string | null
  raw: Record<string, unknown>
}
