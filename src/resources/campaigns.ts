import { HttpClient } from '../http';
import type {
  Campaign,
  CampaignResponse,
  CampaignStatsResponse,
  CampaignTestResponse,
  CancelCampaignResponse,
  CreateCampaignParams,
  ListCampaignsParams,
  ListCampaignsResponse,
  SendCampaignParams,
  SendCampaignResponse,
  UpdateCampaignParams
} from '../types';

export class CampaignsResource {
  constructor(private readonly http: HttpClient) {}

  async list(params: ListCampaignsParams = {}): Promise<ListCampaignsResponse> {
    return this.http.get<ListCampaignsResponse>('/campaigns', {
      query: params,
      authMode: 'secret'
    });
  }

  async create(params: CreateCampaignParams): Promise<Campaign> {
    const response = await this.http.post<CampaignResponse>('/campaigns', {
      body: params,
      authMode: 'secret'
    });
    return response.data;
  }

  async get(id: string): Promise<Campaign> {
    const response = await this.http.get<CampaignResponse>(`/campaigns/${id}`, {
      authMode: 'secret'
    });
    return response.data;
  }

  async update(id: string, params: UpdateCampaignParams): Promise<Campaign> {
    const response = await this.http.put<CampaignResponse>(`/campaigns/${id}`, {
      body: params,
      authMode: 'secret'
    });
    return response.data;
  }

  async send(id: string, params?: SendCampaignParams): Promise<SendCampaignResponse> {
    return this.http.post<SendCampaignResponse>(`/campaigns/${id}/send`, {
      body: params,
      authMode: 'secret'
    });
  }

  async cancel(id: string): Promise<CancelCampaignResponse> {
    return this.http.post<CancelCampaignResponse>(`/campaigns/${id}/cancel`, {
      authMode: 'secret'
    });
  }

  async test(id: string, email: string): Promise<CampaignTestResponse> {
    return this.http.post<CampaignTestResponse>(`/campaigns/${id}/test`, {
      body: { email },
      authMode: 'secret'
    });
  }

  async stats(id: string): Promise<CampaignStatsResponse> {
    return this.http.get<CampaignStatsResponse>(`/campaigns/${id}/stats`, {
      authMode: 'secret'
    });
  }
}
