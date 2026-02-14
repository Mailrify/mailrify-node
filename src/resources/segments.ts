import { HttpClient } from '../http';
import type {
  CreateSegmentParams,
  ListSegmentContactsParams,
  ListSegmentContactsResponse,
  Segment,
  UpdateSegmentParams
} from '../types';

export class SegmentsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Segment[]> {
    return this.http.get<Segment[]>('/segments', {
      authMode: 'secret'
    });
  }

  async create(params: CreateSegmentParams): Promise<Segment> {
    return this.http.post<Segment>('/segments', {
      body: params,
      authMode: 'secret'
    });
  }

  async get(id: string): Promise<Segment> {
    return this.http.get<Segment>(`/segments/${id}`, {
      authMode: 'secret'
    });
  }

  async update(id: string, params: UpdateSegmentParams): Promise<Segment> {
    return this.http.patch<Segment>(`/segments/${id}`, {
      body: params,
      authMode: 'secret'
    });
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/segments/${id}`, {
      authMode: 'secret'
    });
  }

  async listContacts(id: string, params: ListSegmentContactsParams = {}): Promise<ListSegmentContactsResponse> {
    return this.http.get<ListSegmentContactsResponse>(`/segments/${id}/contacts`, {
      query: params,
      authMode: 'secret'
    });
  }
}
