import { HttpClient } from '../http';
import type { SendEmailParams, SendEmailResponse, VerifyEmailResponse } from '../types';

export class EmailsResource {
  constructor(private readonly http: HttpClient) {}

  async send(params: SendEmailParams): Promise<SendEmailResponse> {
    return this.http.post<SendEmailResponse>('/v1/send', {
      body: params,
      authMode: 'secret'
    });
  }

  async verify(email: string): Promise<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>('/v1/verify', {
      body: { email },
      authMode: 'secret'
    });
  }
}
