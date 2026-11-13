import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:5000/api/v1';
const TEST_ORIGIN = process.env.TEST_ORIGIN || 'http://localhost:3000';

// Session cookies are kept in memory only. Persisting them to disk (the old
// `.admin-token.json` behavior) creates a credential artifact that can be
// accidentally committed.
let cachedCookie = '';
let cachedExpiresAt = 0;

export function envFile() {
  return fs.readFileSync(path.join(__dirname, '..', '..', 'server', '.env'), 'utf8');
}

export function envGet(k) {
  return (envFile().match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() || '';
}

function readSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }
  const raw = headers.get('set-cookie');
  return raw ? raw.split(/,(?=\s*[^;=]+=)/) : [];
}

function cookieValue(cookieHeader, name) {
  const part = cookieHeader
    .split('; ')
    .find((entry) => entry.startsWith(name + '='));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : '';
}

/**
 * Logs in as the seeded admin and returns a Cookie header string. The name is
 * retained for older probe scripts, but no bearer/JWT token is exposed or
 * written to disk.
 */
export async function getAdminToken(force = false) {
  if (!force && cachedCookie && cachedExpiresAt > Date.now()) {
    return cachedCookie;
  }

  const response = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: TEST_ORIGIN },
    body: JSON.stringify({
      email: envGet('ADMIN_EMAIL'),
      password: envGet('ADMIN_PASSWORD'),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('admin login ' + response.status + ': ' + text.slice(0, 120));
  }

  const cookieHeader = readSetCookies(response.headers)
    .map((line) => line.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');

  if (!cookieHeader.includes('voss_access_token=')) {
    throw new Error('no auth cookies in login response');
  }

  cachedCookie = cookieHeader;
  cachedExpiresAt = Date.now() + 5 * 60 * 1000;
  return cachedCookie;
}

export async function adminApi(method, url, data) {
  const cookieHeader = await getAdminToken();
  const headers = {
    Cookie: cookieHeader,
    Origin: TEST_ORIGIN,
  };
  const csrfToken = cookieValue(cookieHeader, 'voss_csrf');
  if (csrfToken) headers['x-csrf-token'] = csrfToken;
  if (data !== undefined && data !== null) headers['Content-Type'] = 'application/json';

  const response = await fetch(API + url, {
    method,
    headers,
    body: data !== undefined && data !== null ? JSON.stringify(data) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}
