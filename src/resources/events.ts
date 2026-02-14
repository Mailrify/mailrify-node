import { HttpClient } from '../http';
import type { ListEventNamesResponse, TrackEventParams, TrackEventResponse } from '../types';

export class EventsResource {
  constructor(private readonly http: HttpClient) {}

  async track(params: TrackEventParams): Promise<TrackEventResponse> {
    return this.http.post<TrackEventResponse>('/v1/track', {
      body: params,
      authMode: 'public'
    });
  }

  async listNames(): Promise<ListEventNamesResponse> {
    return this.http.get<ListEventNamesResponse>('/events/names', {
      authMode: 'secret'
    });
  }

  async getNames(): Promise<ListEventNamesResponse> {
    return this.listNames();
  }
}
