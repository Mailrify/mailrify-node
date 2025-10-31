import { describe, expect, it } from 'vitest';
import { Client } from '../../src/index.js';

describe('Client', () => {
  it('exposes resource namespaces', () => {
    const client = new Client({ apiKey: 'test-key', fetch });
    expect(client.domains).toBeDefined();
    expect(client.emails).toBeDefined();
    expect(client.contacts).toBeDefined();
    expect(client.campaigns).toBeDefined();
  });
});
