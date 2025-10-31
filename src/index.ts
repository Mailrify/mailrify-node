import type { ClientConfig } from './config.js';
import { HttpClient } from './client.js';
import { CampaignsAPI } from './resources/campaigns.js';
import { ContactsAPI } from './resources/contacts.js';
import { DomainsAPI } from './resources/domains.js';
import { EmailsAPI } from './resources/emails.js';

export { HttpClient } from './client.js';

/**
 * Main entry point for interacting with the Mailrify API.
 */
export class Client {
  /** Domains resource. */
  readonly domains: DomainsAPI;
  /** Emails resource. */
  readonly emails: EmailsAPI;
  /** Contacts resource. */
  readonly contacts: ContactsAPI;
  /** Campaigns resource. */
  readonly campaigns: CampaignsAPI;

  private readonly http: HttpClient;

  constructor(config: ClientConfig) {
    this.http = new HttpClient(config);
    this.domains = new DomainsAPI(this.http);
    this.emails = new EmailsAPI(this.http);
    this.contacts = new ContactsAPI(this.http);
    this.campaigns = new CampaignsAPI(this.http);
  }
}

export type { ClientConfig } from './config.js';
export * from './errors.js';
export * from './resources/campaigns.js';
export * from './resources/contacts.js';
export * from './resources/domains.js';
export * from './resources/emails.js';
export * from './types/openapi.js';
