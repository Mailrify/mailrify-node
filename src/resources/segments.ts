import { HttpClient } from '../http';
import type {
  AddStaticSegmentMembersResponse,
  CreateSegmentParams,
  ListSegmentContactsParams,
  ListSegmentContactsResponse,
  RemoveStaticSegmentMembersResponse,
  Segment,
  StaticSegmentMembersParams,
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

  async addStaticMembers(id: string, params: StaticSegmentMembersParams): Promise<AddStaticSegmentMembersResponse> {
    return this.http.post<AddStaticSegmentMembersResponse>(`/segments/${id}/members`, {
      body: params,
      authMode: 'secret'
    });
  }

  async removeStaticMembers(
    id: string,
    params: StaticSegmentMembersParams
  ): Promise<RemoveStaticSegmentMembersResponse> {
    return this.http.delete<RemoveStaticSegmentMembersResponse>(`/segments/${id}/members`, {
      body: params,
      authMode: 'secret'
    });
  }
}
