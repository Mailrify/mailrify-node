export interface MailGlyphConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export type ApiKeyType = 'secret' | 'public';

export interface Recipient {
  name?: string;
  email: string;
}

export interface Attachment {
  filename: string;
  content: string;
  contentType: string;
}

export interface SendEmailParams {
  to: string | Recipient | Array<string | Recipient>;
  from: string | Recipient;
  subject?: string;
  body?: string;
  /**
   * The plain text version of the message.
   *
   * If not provided, the `body` will be used to generate a plain text version.
   * You can opt out of this behavior by setting value to an empty string.
   */
  text?: string;
  template?: string;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  reply?: string;
  name?: string;
  subscribed?: boolean;
  attachments?: Attachment[];
}

export interface SendEmailResponse {
  success: boolean;
  data: {
    emails: Array<{
      contact: {
        id: string;
        email: string;
      };
      email: string;
    }>;
    timestamp: string;
  };
}

export interface VerifyEmailResponse {
  success: boolean;
  data: {
    email: string;
    valid: boolean;
    isDisposable: boolean;
    isAlias: boolean;
    isTypo: boolean;
    isPlusAddressed: boolean;
    isRandomInput: boolean;
    isPersonalEmail: boolean;
    domainExists: boolean;
    hasWebsite: boolean;
    hasMxRecords: boolean;
    suggestedEmail?: string | null;
    reasons: string[];
  };
}

export interface TrackEventParams {
  email: string;
  event: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
}

export interface TrackEventResponse {
  success: boolean;
  data: {
    contact: string;
    event: string;
    timestamp: string;
  };
}

export interface ListEventNamesResponse {
  eventNames: string[];
}

export interface Contact {
  id: string;
  email: string;
  subscribed: boolean;
  data: Record<string, unknown> | null;
  status: 'ACTIVE' | 'PENDING';
  expiresAt?: string | null;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMeta {
  isNew: boolean;
  isUpdate: boolean;
}

export interface ContactWithMeta extends Contact {
  _meta?: ContactMeta;
}

export interface ListContactsParams {
  limit?: number;
  cursor?: string;
  subscribed?: boolean;
  search?: string;
}

export interface ListContactsResponse {
  data: Contact[];
  cursor?: string | null;
  hasMore: boolean;
  total?: number;
}

export interface CreateContactParams {
  email: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateContactParams {
  subscribed?: boolean;
  data?: Record<string, unknown>;
}

export type FilterLogic = 'AND' | 'OR';
export type SegmentFilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'exists'
  | 'notExists'
  | 'within'
  | 'olderThan'
  | 'triggered'
  | 'triggeredWithin'
  | 'triggeredOlderThan'
  | 'notTriggered';
export type SegmentFilterUnit = 'days' | 'hours' | 'minutes';

export interface SegmentFilter {
  field: string;
  operator: SegmentFilterOperator;
  value?: unknown;
  unit?: SegmentFilterUnit;
}

export interface FilterGroup {
  filters: SegmentFilter[];
  conditions?: FilterCondition;
}

export interface FilterCondition {
  logic: FilterLogic;
  groups: FilterGroup[];
}

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
export type AudienceType = 'ALL' | 'SEGMENT' | 'FILTERED';

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  subject: string;
  body: string;
  from: string;
  fromName?: string | null;
  replyTo?: string | null;
  audienceType: AudienceType;
  audienceCondition?: FilterCondition;
  segmentId?: string | null;
  status: CampaignStatus;
  totalRecipients?: number;
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  bouncedCount?: number;
  scheduledFor?: string | null;
  sentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  segment?: Segment;
}

export interface ListCampaignsParams {
  page?: number;
  pageSize?: number;
  status?: CampaignStatus;
}

export interface ListCampaignsResponse {
  data: Campaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCampaignParams {
  name: string;
  subject: string;
  body: string;
  from: string;
  audienceType: AudienceType;
  description?: string;
  fromName?: string;
  replyTo?: string;
  segmentId?: string;
  audienceCondition?: FilterCondition;
}

export interface UpdateCampaignParams {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  audienceType?: AudienceType;
  segmentId?: string;
  audienceCondition?: FilterCondition;
}

export interface SendCampaignParams {
  scheduledFor?: string | null;
}

export interface CampaignResponse {
  success: boolean;
  data: Campaign;
}

export interface SendCampaignResponse extends CampaignResponse {
  message: string;
}

export interface CancelCampaignResponse extends CampaignResponse {
  message?: string;
}

export interface CampaignTestResponse {
  success: boolean;
  message?: string;
}

export interface CampaignStatsResponse {
  success: boolean;
  data: Record<string, unknown>;
}

export interface Segment {
  id: string;
  name: string;
  description?: string | null;
  type: 'DYNAMIC' | 'STATIC';
  condition: FilterCondition | null;
  trackMembership: boolean;
  memberCount: number;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSegmentParams {
  name: string;
  condition: FilterCondition;
  description?: string;
  trackMembership?: boolean;
}

export interface UpdateSegmentParams {
  name?: string;
  description?: string;
  condition?: FilterCondition;
  trackMembership?: boolean;
}

export interface ListSegmentContactsParams {
  page?: number;
  pageSize?: number;
}

export interface ListSegmentContactsResponse {
  data: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StaticSegmentMembersParams {
  emails: string[];
}

export interface AddStaticSegmentMembersResponse {
  added: number;
  notFound: string[];
}

export interface RemoveStaticSegmentMembersResponse {
  removed: number;
}

export type TemplateType = 'TRANSACTIONAL' | 'MARKETING';

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  subject: string;
  body: string;
  text?: string | null;
  from: string;
  fromName?: string | null;
  replyTo?: string | null;
  type: TemplateType;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListTemplatesParams {
  limit?: number;
  cursor?: string;
  type?: TemplateType;
  search?: string;
}

export interface ListTemplatesResponse {
  data: Template[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTemplateParams {
  name: string;
  subject: string;
  body: string;
  type: TemplateType;
}

export interface UpdateTemplateParams {
  name?: string;
  subject?: string;
  body?: string;
  type?: TemplateType;
}

export interface ApiErrorPayload {
  code?: number;
  error?: string;
  message?: string;
  time?: number;
  [key: string]: unknown;
}

export interface RequestOptions {
  query?: object;
  body?: unknown;
  authMode?: 'secret' | 'public' | 'none';
  headers?: Record<string, string>;
  timeout?: number;
}
