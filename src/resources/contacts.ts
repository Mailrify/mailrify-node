import type { HttpClient } from '../client.js';
import type { operations } from '../types/openapi.js';
import { assertNonEmptyString } from '../utils/schema.js';

export type ContactListResponse =
  operations['getContacts']['responses'][200]['content']['application/json'];
export type ContactResponse =
  operations['getContact']['responses'][200]['content']['application/json'];
export type CreateContactRequest =
  operations['createContact']['requestBody']['content']['application/json'];
export type CreateContactResponse =
  operations['createContact']['responses'][200]['content']['application/json'];
export type UpsertContactRequest =
  operations['upsertContact']['requestBody']['content']['application/json'];
export type UpsertContactResponse =
  operations['upsertContact']['responses'][200]['content']['application/json'];
export type UpdateContactRequest =
  operations['updateContact']['requestBody']['content']['application/json'];
export type UpdateContactResponse =
  operations['updateContact']['responses'][200]['content']['application/json'];
export type DeleteContactResponse =
  operations['deleteContact']['responses'][200]['content']['application/json'];

type ListContactsQuery = NonNullable<operations['getContacts']['parameters']['query']>;

export interface ListContactsParams
  extends Omit<ListContactsQuery, 'page' | 'limit' | 'emails' | 'ids'> {
  page?: number | string;
  limit?: number | string;
  emails?: string | string[];
  ids?: string | string[];
}

export class ContactsAPI {
  constructor(private readonly client: HttpClient) {}

  async list(contactBookId: string, params: ListContactsParams = {}): Promise<ContactListResponse> {
    assertNonEmptyString(contactBookId, 'contactBookId');
    const query: Record<string, unknown> = {};

    if (params.page !== undefined) {
      query.page = params.page;
    }
    if (params.limit !== undefined) {
      query.limit = params.limit;
    }
    if (params.emails) {
      query.emails = Array.isArray(params.emails) ? params.emails.join(',') : params.emails;
    }
    if (params.ids) {
      query.ids = Array.isArray(params.ids) ? params.ids.join(',') : params.ids;
    }

    return this.client.get<ContactListResponse>(
      `/v1/contactBooks/${encodeURIComponent(contactBookId)}/contacts`,
      { query },
    );
  }

  async create(
    contactBookId: string,
    request: CreateContactRequest,
  ): Promise<CreateContactResponse> {
    assertNonEmptyString(contactBookId, 'contactBookId');
    assertNonEmptyString(request.email, 'request.email');

    return this.client.post<CreateContactResponse>(
      `/v1/contactBooks/${encodeURIComponent(contactBookId)}/contacts`,
      { body: request },
    );
  }

  async get(contactBookId: string, contactId: string): Promise<ContactResponse> {
    assertNonEmptyString(contactBookId, 'contactBookId');
    assertNonEmptyString(contactId, 'contactId');

    return this.client.get<ContactResponse>(
      `/v1/contactBooks/${encodeURIComponent(contactBookId)}/contacts/${encodeURIComponent(contactId)}`,
    );
  }

  async upsert(
    contactBookId: string,
    contactId: string,
    request: UpsertContactRequest,
  ): Promise<UpsertContactResponse> {
    assertNonEmptyString(contactBookId, 'contactBookId');
    assertNonEmptyString(contactId, 'contactId');
    assertNonEmptyString(request.email, 'request.email');

    return this.client.put<UpsertContactResponse>(
      `/v1/contactBooks/${encodeURIComponent(contactBookId)}/contacts/${encodeURIComponent(contactId)}`,
      { body: request },
    );
  }

  async update(
    contactBookId: string,
    contactId: string,
    request: UpdateContactRequest,
  ): Promise<UpdateContactResponse> {
    assertNonEmptyString(contactBookId, 'contactBookId');
    assertNonEmptyString(contactId, 'contactId');

    return this.client.patch<UpdateContactResponse>(
      `/v1/contactBooks/${encodeURIComponent(contactBookId)}/contacts/${encodeURIComponent(contactId)}`,
      { body: request },
    );
  }

  async delete(contactBookId: string, contactId: string): Promise<DeleteContactResponse> {
    assertNonEmptyString(contactBookId, 'contactBookId');
    assertNonEmptyString(contactId, 'contactId');

    return this.client.delete<DeleteContactResponse>(
      `/v1/contactBooks/${encodeURIComponent(contactBookId)}/contacts/${encodeURIComponent(contactId)}`,
    );
  }
}
