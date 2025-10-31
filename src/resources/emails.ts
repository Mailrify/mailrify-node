import type { HttpClient } from '../client.js';
import type { operations } from '../types/openapi.js';
import { ValidationError } from '../errors.js';
import {
  assertArray,
  assertIsoDate,
  assertNonEmptyString,
  optionalIsoDate,
} from '../utils/schema.js';

export type SendEmailRequest =
  operations['sendEmail']['requestBody']['content']['application/json'];
export type SendEmailResponse =
  operations['sendEmail']['responses'][200]['content']['application/json'];
export type GetEmailResponse =
  operations['getEmail']['responses'][200]['content']['application/json'];
export type ListEmailsResponse =
  operations['listEmails']['responses'][200]['content']['application/json'];
export type UpdateScheduleResponse =
  operations['updateSchedule']['responses'][200]['content']['application/json'];
export type CancelScheduleResponse =
  operations['cancelSchedule']['responses'][200]['content']['application/json'];
export type BatchEmailRequest =
  operations['batchEmail']['requestBody']['content']['application/json'];
export type BatchEmailResponse =
  operations['batchEmail']['responses'][200]['content']['application/json'];

type ListEmailsQuery = NonNullable<operations['listEmails']['parameters']['query']>;

export interface ListEmailsParams
  extends Omit<ListEmailsQuery, 'page' | 'limit' | 'domainId' | 'startDate' | 'endDate'> {
  page?: number | string;
  limit?: number | string;
  startDate?: string | Date;
  endDate?: string | Date;
  domainId?: string | string[];
}

export class EmailsAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Send a single email message.
   */
  async send(request: SendEmailRequest): Promise<SendEmailResponse> {
    this.validateSendRequest(request);

    return this.client.post<SendEmailResponse>('/v1/emails', {
      body: request,
      idempotent: false,
    });
  }

  /**
   * Retrieve email metadata and event timeline.
   */
  async get(emailId: string): Promise<GetEmailResponse> {
    assertNonEmptyString(emailId, 'emailId');
    return this.client.get<GetEmailResponse>(`/v1/emails/${encodeURIComponent(emailId)}`);
  }

  /**
   * List recent emails, optionally filtered by date range or domain.
   */
  async list(params: ListEmailsParams = {}): Promise<ListEmailsResponse> {
    const query: Record<string, unknown> = {};
    if (params.page !== undefined) {
      query.page = params.page;
    }
    if (params.limit !== undefined) {
      query.limit = params.limit;
    }
    if (params.startDate) {
      if (params.startDate instanceof Date) {
        query.startDate = params.startDate.toISOString();
      } else {
        assertIsoDate(params.startDate, 'startDate');
        query.startDate = params.startDate;
      }
    }
    if (params.endDate) {
      if (params.endDate instanceof Date) {
        query.endDate = params.endDate.toISOString();
      } else {
        assertIsoDate(params.endDate, 'endDate');
        query.endDate = params.endDate;
      }
    }
    if (params.domainId) {
      query.domainId = params.domainId;
    }

    return this.client.get<ListEmailsResponse>('/v1/emails', { query });
  }

  /**
   * Update the scheduled send time for a queued email.
   */
  async schedule(emailId: string, scheduledAt: string | Date): Promise<UpdateScheduleResponse> {
    assertNonEmptyString(emailId, 'emailId');
    const timestamp = scheduledAt instanceof Date ? scheduledAt.toISOString() : scheduledAt;
    assertIsoDate(timestamp, 'scheduledAt');

    return this.client.patch<UpdateScheduleResponse>(`/v1/emails/${encodeURIComponent(emailId)}`, {
      body: { scheduledAt: timestamp },
    });
  }

  /**
   * Cancel a scheduled email delivery.
   */
  async cancel(emailId: string): Promise<CancelScheduleResponse> {
    assertNonEmptyString(emailId, 'emailId');
    return this.client.post<CancelScheduleResponse>(
      `/v1/emails/${encodeURIComponent(emailId)}/cancel`,
    );
  }

  /**
   * Send multiple emails in a single batch API call.
   */
  async batch(requests: BatchEmailRequest): Promise<BatchEmailResponse> {
    assertArray<SendEmailRequest>(requests, 'requests');
    const payload = requests as SendEmailRequest[];
    payload.forEach((request, index) => this.validateSendRequest(request, `requests[${index}]`));

    return this.client.post<BatchEmailResponse>('/v1/emails/batch', {
      body: payload,
      idempotent: false,
    });
  }

  private validateSendRequest(request: SendEmailRequest, prefix = 'request'): void {
    if (Array.isArray(request.to)) {
      assertArray<string>(request.to, `${prefix}.to`);
      if (request.to.length === 0) {
        throw new ValidationError('`to` must contain at least one recipient.');
      }
      request.to.forEach((recipient: string, index: number) =>
        assertNonEmptyString(recipient, `${prefix}.to[${index}]`),
      );
    } else {
      assertNonEmptyString(request.to, `${prefix}.to`);
    }

    assertNonEmptyString(request.from, `${prefix}.from`);

    if (!request.subject && !request.templateId) {
      throw new ValidationError('Either subject or templateId must be provided.');
    }

    optionalIsoDate(request.scheduledAt, `${prefix}.scheduledAt`);
  }
}
