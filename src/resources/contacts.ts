import { HttpClient } from '../http';
import type {
  Contact,
  ContactWithMeta,
  CreateContactParams,
  ListContactsParams,
  ListContactsResponse,
  UpdateContactParams
} from '../types';

export class ContactsResource {
  constructor(private readonly http: HttpClient) {}

  async list(params: ListContactsParams = {}): Promise<ListContactsResponse> {
    return this.http.get<ListContactsResponse>('/contacts', {
      query: params,
      authMode: 'secret'
    });
  }

  async create(params: CreateContactParams): Promise<ContactWithMeta> {
    return this.http.post<ContactWithMeta>('/contacts', {
      body: params,
      authMode: 'secret'
    });
  }

  async get(id: string): Promise<Contact> {
    return this.http.get<Contact>(`/contacts/${id}`, {
      authMode: 'secret'
    });
  }

  async update(id: string, params: UpdateContactParams): Promise<Contact> {
    return this.http.patch<Contact>(`/contacts/${id}`, {
      body: params,
      authMode: 'secret'
    });
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/contacts/${id}`, {
      authMode: 'secret'
    });
  }

  async count(params: Omit<ListContactsParams, 'cursor' | 'limit'> = {}): Promise<number> {
    const result = await this.list({ ...params, limit: 1 });
    return result.total ?? result.data.length;
  }
}
