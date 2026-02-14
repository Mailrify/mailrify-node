import { afterEach, describe, expect, it, vi } from 'vitest';

import Mailrify, { NotFoundError } from '../../src';
import { getRequest, installFetchMock, jsonResponse, emptyResponse } from './test-utils';

const segment = {
  id: 'seg_123',
  name: 'Premium Users',
  description: 'Paid users',
  condition: {
    logic: 'AND',
    groups: [{ filters: [{ field: 'data.plan', operator: 'equals', value: 'premium' }] }]
  },
  trackMembership: true,
  memberCount: 10,
  projectId: 'proj_123',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

const contact = {
  id: 'c_123',
  email: 'user@example.com',
  subscribed: true,
  data: { plan: 'premium' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

describe('segments resource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('list() returns segments', async () => {
    installFetchMock([jsonResponse([segment])]);
    const client = new Mailrify('sk_test_123');

    const result = await client.segments.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('seg_123');
  });

  it('create() sends condition payload', async () => {
    const fetchMock = installFetchMock([jsonResponse(segment, 201)]);
    const client = new Mailrify('sk_test_123');

    const result = await client.segments.create({
      name: 'Premium Users',
      condition: {
        logic: 'AND',
        groups: [{ filters: [{ field: 'data.plan', operator: 'equals', value: 'premium' }] }]
      },
      trackMembership: true
    });

    expect(result.id).toBe('seg_123');
    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).condition.logic).toBe('AND');
  });

  it('get() returns segment by ID', async () => {
    installFetchMock([jsonResponse(segment)]);
    const client = new Mailrify('sk_test_123');

    const result = await client.segments.get('seg_123');

    expect(result.id).toBe('seg_123');
  });

  it('get() throws NotFoundError on 404', async () => {
    installFetchMock([jsonResponse({ message: 'Segment not found' }, 404)]);
    const client = new Mailrify('sk_test_123');

    await expect(client.segments.get('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('update() updates segment conditions', async () => {
    installFetchMock([jsonResponse({ ...segment, name: 'VIP Users' })]);
    const client = new Mailrify('sk_test_123');

    const result = await client.segments.update('seg_123', { name: 'VIP Users' });

    expect(result.name).toBe('VIP Users');
  });

  it('delete() succeeds with 204', async () => {
    installFetchMock([emptyResponse(204)]);
    const client = new Mailrify('sk_test_123');

    await expect(client.segments.delete('seg_123')).resolves.toBeUndefined();
  });

  it('listContacts() returns paginated segment contacts', async () => {
    installFetchMock([
      jsonResponse({ data: [contact], total: 1, page: 1, pageSize: 20, totalPages: 1 })
    ]);
    const client = new Mailrify('sk_test_123');

    const result = await client.segments.listContacts('seg_123');

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('listContacts() supports page params', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ data: [contact], total: 1, page: 2, pageSize: 5, totalPages: 1 })
    ]);
    const client = new Mailrify('sk_test_123');

    await client.segments.listContacts('seg_123', { page: 2, pageSize: 5 });

    const { url } = getRequest(fetchMock);
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=5');
  });
});
