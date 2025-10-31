import type { HttpClient } from '../client.js';
import type { operations } from '../types/openapi.js';
import { assertNonEmptyString } from '../utils/schema.js';

type CreateCampaignPayload =
  operations['createCampaign']['requestBody']['content']['application/json'];
type ScheduleCampaignPayload =
  operations['scheduleCampaign']['requestBody']['content']['application/json'];

export type CampaignResponse =
  operations['getCampaign']['responses'][200]['content']['application/json'];
export type CreateCampaignResponse =
  operations['createCampaign']['responses'][200]['content']['application/json'];
export type ScheduleCampaignResponse =
  operations['scheduleCampaign']['responses'][200]['content']['application/json'];
export type PauseCampaignResponse =
  operations['pauseCampaign']['responses'][200]['content']['application/json'];
export type ResumeCampaignResponse =
  operations['resumeCampaign']['responses'][200]['content']['application/json'];

export interface CreateCampaignOptions extends Omit<CreateCampaignPayload, 'scheduledAt'> {
  scheduledAt?: string | Date;
}

export interface ScheduleCampaignOptions extends Omit<ScheduleCampaignPayload, 'scheduledAt'> {
  scheduledAt?: string | Date;
}

export class CampaignsAPI {
  constructor(private readonly client: HttpClient) {}

  async create(request: CreateCampaignOptions): Promise<CreateCampaignResponse> {
    assertNonEmptyString(request.name, 'request.name');
    assertNonEmptyString(request.from, 'request.from');
    assertNonEmptyString(request.subject, 'request.subject');
    assertNonEmptyString(request.contactBookId, 'request.contactBookId');

    const payload =
      request.scheduledAt instanceof Date
        ? { ...request, scheduledAt: request.scheduledAt.toISOString() }
        : request;

    if (payload.scheduledAt) {
      assertNonEmptyString(payload.scheduledAt, 'request.scheduledAt');
    }

    return this.client.post<CreateCampaignResponse>('/v1/campaigns', { body: payload });
  }

  async get(campaignId: string): Promise<CampaignResponse> {
    assertNonEmptyString(campaignId, 'campaignId');
    return this.client.get<CampaignResponse>(`/v1/campaigns/${encodeURIComponent(campaignId)}`);
  }

  async schedule(
    campaignId: string,
    request: ScheduleCampaignOptions,
  ): Promise<ScheduleCampaignResponse> {
    assertNonEmptyString(campaignId, 'campaignId');
    const payload =
      request.scheduledAt instanceof Date
        ? { ...request, scheduledAt: request.scheduledAt.toISOString() }
        : request;

    if (payload.scheduledAt) {
      assertNonEmptyString(payload.scheduledAt, 'request.scheduledAt');
    }

    return this.client.post<ScheduleCampaignResponse>(
      `/v1/campaigns/${encodeURIComponent(campaignId)}/schedule`,
      { body: payload },
    );
  }

  async pause(campaignId: string): Promise<PauseCampaignResponse> {
    assertNonEmptyString(campaignId, 'campaignId');
    return this.client.post<PauseCampaignResponse>(
      `/v1/campaigns/${encodeURIComponent(campaignId)}/pause`,
    );
  }

  async resume(campaignId: string): Promise<ResumeCampaignResponse> {
    assertNonEmptyString(campaignId, 'campaignId');
    return this.client.post<ResumeCampaignResponse>(
      `/v1/campaigns/${encodeURIComponent(campaignId)}/resume`,
    );
  }
}
