import { HttpClient } from './http';
import { CampaignsResource } from './resources/campaigns';
import { ContactsResource } from './resources/contacts';
import { EmailsResource } from './resources/emails';
import { EventsResource } from './resources/events';
import { SegmentsResource } from './resources/segments';
import { TemplatesResource } from './resources/templates';
import type { ApiKeyType, MailGlyphConfig } from './types';

export class MailGlyph {
  public readonly emails: EmailsResource;
  public readonly events: EventsResource;
  public readonly contacts: ContactsResource;
  public readonly campaigns: CampaignsResource;
  public readonly segments: SegmentsResource;
  public readonly templates: TemplatesResource;
  public readonly keyType: ApiKeyType;

  private readonly http: HttpClient;

  constructor(apiKey: string, config: Omit<MailGlyphConfig, 'apiKey'> = {}) {
    const httpConfig: { apiKey: string; baseUrl?: string; timeout?: number } = { apiKey };

    if (config.baseUrl !== undefined) {
      httpConfig.baseUrl = config.baseUrl;
    }

    if (config.timeout !== undefined) {
      httpConfig.timeout = config.timeout;
    }

    this.http = new HttpClient(httpConfig);

    this.keyType = this.http.keyType;
    this.emails = new EmailsResource(this.http);
    this.events = new EventsResource(this.http);
    this.contacts = new ContactsResource(this.http);
    this.campaigns = new CampaignsResource(this.http);
    this.segments = new SegmentsResource(this.http);
    this.templates = new TemplatesResource(this.http);
  }
}

export * from './errors';
export type * from './types';

export default MailGlyph;
