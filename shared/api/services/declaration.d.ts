// @ts-ignore - El path mapping @antojados/http/* está definido en tsconfig.json
declare module '@antojados/http' {
  import { AxiosInstance } from 'axios'
  export const httpClient: AxiosInstance
}
