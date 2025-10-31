import type { HttpClient } from '../client.js';
import type { operations } from '../types/openapi.js';
import { assertNonEmptyString, assertPositiveNumber } from '../utils/schema.js';

export type Domain = operations['getDomain']['responses'][200]['content']['application/json'];
export type DomainListResponse =
  operations['listDomains']['responses'][200]['content']['application/json'];
export type CreateDomainRequest =
  operations['createDomain']['requestBody']['content']['application/json'];
export type CreateDomainResponse =
  operations['createDomain']['responses'][200]['content']['application/json'];
export type VerifyDomainResponse =
  operations['verifyDomain']['responses'][200]['content']['application/json'];
export type DeleteDomainResponse =
  operations['deleteDomain']['responses'][200]['content']['application/json'];

export class DomainsAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Retrieve all domains belonging to the authenticated account.
   */
  async list(): Promise<DomainListResponse> {
    return this.client.get<DomainListResponse>('/v1/domains');
  }

  /**
   * Create a new sending domain.
   */
  async create(request: CreateDomainRequest): Promise<CreateDomainResponse> {
    assertNonEmptyString(request?.name, 'name');
    assertNonEmptyString(request?.region, 'region');

    return this.client.post<CreateDomainResponse>('/v1/domains', {
      body: request,
    });
  }

  /**
   * Retrieve full metadata for a single domain.
   */
  async get(domainId: number): Promise<Domain> {
    assertPositiveNumber(domainId, 'domainId');
    return this.client.get<Domain>(`/v1/domains/${domainId}`);
  }

  /**
   * Verify DNS records for a domain.
   */
  async verify(domainId: number): Promise<VerifyDomainResponse> {
    assertPositiveNumber(domainId, 'domainId');
    return this.client.put<VerifyDomainResponse>(`/v1/domains/${domainId}/verify`);
  }

  /**
   * Remove a domain from the account.
   */
  async delete(domainId: number): Promise<DeleteDomainResponse> {
    assertPositiveNumber(domainId, 'domainId');
    return this.client.delete<DeleteDomainResponse>(`/v1/domains/${domainId}`);
  }
}
