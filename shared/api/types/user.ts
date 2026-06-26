export interface User {
  userId: string
  email?: string | null
  displayName?: string | null
  username?: string | null
  avatarUrl?: string | null
  bio?: string | null
  cityCode?: string | null
  status?: string | null
}

export interface UserCreateInput {
  email: string
  displayName?: string
  username?: string
  status?: string
  cityCode?: string | null
}

export interface UserUpdateInput {
  email?: string
  displayName?: string
  username?: string
  status?: string
  cityCode?: string | null
}

export interface UserListQuery {
  page?: number
  perPage?: number
  search?: string
  status?: string
  cityCode?: string | null
}
