import { createHmac, timingSafeEqual } from 'node:crypto';
export const COOKIE = 'idea_lab_session';
export function enabledSecret() {
  const s = process.env.LAB_ACCESS_SECRET;
  return s && s.length >= 32 ? s : null;
}
export function equal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function session(secret: string, now = Date.now()) {
  const expires = String(now + 7 * 86400000);
  return `${expires}.${createHmac('sha256', secret).update(expires).digest('hex')}`;
}
export function validSession(value: string, secret: string, now = Date.now()) {
  const [expires, sig, ...extra] = value.split('.');
  if (
    extra.length ||
    !/^\d+$/.test(expires ?? '') ||
    !sig ||
    Number(expires) <= now ||
    Number(expires) > now + 7 * 86400000
  )
    return false;
  return equal(sig, createHmac('sha256', secret).update(expires).digest('hex'));
}
export function isDemo() {
  return process.env.IDEA_LAB_DEMO === 'true';
}

export function sameOrigin(headers: Headers) {
  try {
    const origin = new URL(headers.get('origin') ?? '');
    return ['https:', 'http:'].includes(origin.protocol) && origin.host === headers.get('host');
  } catch {
    return false;
  }
}
