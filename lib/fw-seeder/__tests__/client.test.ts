import { describe, it, expect, vi } from 'vitest';

import {
  resolveAuthMode,
  buildAuthHeader,
  FourthwallApiError
} from '../client';

describe('resolveAuthMode', () => {
  it('prefers bearer when accessToken is present', () => {
    expect(resolveAuthMode({ accessToken: 'tok' })).toBe('bearer');
  });

  it('falls back to basic when username+password are present', () => {
    expect(resolveAuthMode({ apiUsername: 'u', apiPassword: 'p' })).toBe('basic');
  });

  it('returns none when no credentials', () => {
    expect(resolveAuthMode({})).toBe('none');
  });

  it('prefers bearer even when basic is also present', () => {
    expect(resolveAuthMode({ accessToken: 'tok', apiUsername: 'u', apiPassword: 'p' })).toBe('bearer');
  });
});

describe('buildAuthHeader', () => {
  it('returns Bearer header', () => {
    expect(buildAuthHeader({ accessToken: 'tok_123' })).toEqual({
      Authorization: 'Bearer tok_123'
    });
  });

  it('returns Basic header with base64', () => {
    const header = buildAuthHeader({ apiUsername: 'user', apiPassword: 'pass' });
    expect(header).toEqual({
      Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}`
    });
  });

  it('returns null when no credentials', () => {
    expect(buildAuthHeader({})).toBeNull();
  });

  it('returns null with only username (no password)', () => {
    expect(buildAuthHeader({ apiUsername: 'user' })).toBeNull();
  });
});

describe('FourthwallApiError', () => {
  it('carries status and data', () => {
    const err = new FourthwallApiError('boom', 500, { detail: 'server error' });
    expect(err.message).toBe('boom');
    expect(err.status).toBe(500);
    expect(err.data).toEqual({ detail: 'server error' });
  });
});
