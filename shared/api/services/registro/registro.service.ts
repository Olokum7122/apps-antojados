import type { AxiosInstance } from 'axios'
import * as sponsorsService from '@antojados/api/services/sponsors/sponsors.service'
import type {
  SponsorDocumentUploadInput,
  SponsorInstanceStatus,
} from '@antojados/api/types/sponsor'

export type InstanciaStatus = SponsorInstanceStatus
export type { SponsorDocumentUploadInput }

export class RegistroService {
  constructor(private readonly _http: AxiosInstance) {}

  async getInstanciaStatus(userId: string): Promise<InstanciaStatus | null> {
    return sponsorsService.getSponsorInstanceStatus(userId)
  }

  async setupSponsorBusiness(
    instanceId: string,
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return sponsorsService.setupSponsorBusiness(instanceId, userId, payload)
  }

  async setupSponsorBilling(
    instanceId: string,
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return sponsorsService.setupSponsorBilling(instanceId, userId, payload)
  }

  async setupSponsorRepresentative(
    instanceId: string,
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return sponsorsService.setupSponsorRepresentative(instanceId, userId, payload)
  }

  async uploadSponsorDocument(input: SponsorDocumentUploadInput): Promise<Record<string, unknown>> {
    return sponsorsService.uploadSponsorDocument(input)
  }
}
