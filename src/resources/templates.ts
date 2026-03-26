import { HttpClient } from '../http';
import type {
  CreateTemplateParams,
  ListTemplatesParams,
  ListTemplatesResponse,
  Template,
  UpdateTemplateParams
} from '../types';

export class TemplatesResource {
  constructor(private readonly http: HttpClient) {}

  async list(params: ListTemplatesParams = {}): Promise<ListTemplatesResponse> {
    return this.http.get<ListTemplatesResponse>('/templates', {
      query: params,
      authMode: 'secret'
    });
  }

  async create(params: CreateTemplateParams): Promise<Template> {
    return this.http.post<Template>('/templates', {
      body: params,
      authMode: 'secret'
    });
  }

  async get(id: string): Promise<Template> {
    return this.http.get<Template>(`/templates/${id}`, {
      authMode: 'secret'
    });
  }

  async update(id: string, params: UpdateTemplateParams): Promise<Template> {
    return this.http.patch<Template>(`/templates/${id}`, {
      body: params,
      authMode: 'secret'
    });
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/templates/${id}`, {
      authMode: 'secret'
    });
  }
}
