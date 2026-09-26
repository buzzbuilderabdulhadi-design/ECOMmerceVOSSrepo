import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, '.admin-token.json');
const API = 'http://localhost:5000/api/v1';

export function envFile() {
  return fs.readFileSync(path.join(__dirname, '..', '..', 'server', '.env'), 'utf8');
}

export function envGet(k) {
  return (envFile().match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() || '';
}

export async function getAdminToken(force = false) {
  if (!force && fs.existsSync(TOKEN_PATH)) {
    const cached = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    if (cached.expiresAt && cached.expiresAt > Date.now()) {
      return cached.accessToken;
    }
  }
  const r = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: envGet('ADMIN_EMAIL'), password: envGet('ADMIN_PASSWORD') }),
  });
  if (!r.ok) throw new Error('admin login ' + r.status + ': ' + (await r.text()).slice(0, 120));
  const body = await r.json();
  const accessToken = body.data?.accessToken;
  if (!accessToken) throw new Error('no accessToken in login response');
  const expiresIn = parseInt(body.data?.expiresIn || '3600', 10);
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify({ accessToken, expiresAt: Date.now() + (expiresIn - 60) * 1000 }));
  return accessToken;
}

export async function adminApi(method, url, data) {
  const token = await getAdminToken();
  const res = await fetch(API + url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}