import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from './tokens.js';

describe('access tokens', () => {
  it('round-trips a signed payload', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'individual' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('individual');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'individual' });
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow();
  });
});

describe('refresh tokens', () => {
  it('generates a token whose hash matches hashRefreshToken', () => {
    const { token, hash } = generateRefreshToken();
    expect(hashRefreshToken(token)).toBe(hash);
  });

  it('generates distinct tokens on each call', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a.token).not.toBe(b.token);
  });

  it('computes an expiry date in the future', () => {
    const expiry = refreshTokenExpiryDate();
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});
