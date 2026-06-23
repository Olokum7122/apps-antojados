import { httpClient } from '@antojados/http/client'
import { API_ENDPOINTS } from '@antojados/http/endpoints'
import type { ApiResponse } from '@antojados/api/types/api'
import type { User, UserCreateInput, UserListQuery, UserUpdateInput } from '@antojados/api/types/user'

interface RawUser extends Record<string, unknown> {
  user_id?: string
  id?: string
  email?: string | null
  display_name?: string | null
  name?: string | null
  username?: string | null
  avatar_url?: string | null
  bio?: string | null
  city_code?: string | null
  status?: string | null
}

function mapUser(raw: RawUser): User {
  return {
    userId: String(raw.user_id || raw.id || ''),
    email: typeof raw.email === 'string' ? raw.email : null,
    displayName:
      typeof raw.display_name === 'string'
        ? raw.display_name
        : typeof raw.name === 'string'
          ? raw.name
          : null,
    username: typeof raw.username === 'string' ? raw.username : null,
    avatarUrl: typeof raw.avatar_url === 'string' ? raw.avatar_url : null,
    bio: typeof raw.bio === 'string' ? raw.bio : null,
    cityCode: typeof raw.city_code === 'string' ? raw.city_code : null,
    status: typeof raw.status === 'string' ? raw.status : null,
  }
}

function toApiPayload(input: UserCreateInput | UserUpdateInput): Record<string, unknown> {
  return {
    email: input.email,
    display_name: input.displayName,
    username: input.username,
    status: input.status,
  }
}

export async function listUsers(params: UserListQuery = {}): Promise<User[]> {
  void params
  throw new Error('users_list_endpoint_not_available')
}

export async function getUser(userId: string): Promise<User> {
  const { data } = await httpClient.get<ApiResponse<RawUser> | RawUser>(
    API_ENDPOINTS.auth.profile(userId),
  )
  return mapUser('data' in data && data.data ? data.data : data)
}

export async function createUser(input: UserCreateInput): Promise<User> {
  void toApiPayload(input)
  throw new Error('users_create_endpoint_not_available')
}

export async function updateUser(userId: string, input: UserUpdateInput): Promise<User> {
  const { data } = await httpClient.patch<ApiResponse<RawUser> | RawUser>(
    API_ENDPOINTS.auth.profile(userId),
    toApiPayload(input),
  )
  return mapUser('data' in data && data.data ? data.data : data)
}

export async function deleteUser(userId: string): Promise<void> {
  void userId
  throw new Error('users_delete_endpoint_not_available')
}
