import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';
const envFile = path.join(__dirname, '..', 'server', '.env');
const env = fs.readFileSync(envFile, 'utf8');
const raw = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
};

async function login(email, password) {
  const res = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  return json.data.accessToken;
}

const token = await login(raw('ADMIN_EMAIL'), raw('ADMIN_PASSWORD'));

const endpoints = [
  ['GET', '/admin/dashboard'],
  ['GET', '/admin/analytics'],
  ['GET', '/admin/analytics/sales?days=30'],
  ['GET', '/admin/analytics/orders'],
  ['GET', '/admin/analytics/products'],
  ['GET', '/admin/analytics/customers'],
  ['GET', '/admin/products?page=1&limit=20'],
  ['GET', '/admin/products?page=1&limit=20&status=active'],
  ['GET', '/admin/categories'],
  ['GET', '/admin/orders?page=1&limit=20'],
  ['GET', '/admin/orders?page=1&limit=20&status=PENDING'],
  ['GET', '/admin/customers?page=1&limit=20'],
  ['GET', '/admin/reviews?page=1&limit=20'],
  ['GET', '/admin/questions?page=1&limit=20'],
  ['GET', '/admin/coupons?page=1&limit=20'],
  ['GET', '/admin/media'],
  ['GET', '/admin/settings'],
  ['GET', '/admin/notifications?page=1&limit=20'],
  ['GET', '/admin/activity-logs?page=1&limit=20'],
  ['GET', '/admin/seo'],
  ['GET', '/admin/homepage'],
];

const rows = [];
for (const [method, url] of endpoints) {
  const t0 = Date.now();
  const res = await fetch(BASE + url, { method, headers: { Authorization: `Bearer ${token}` } });
  const ms = Date.now() - t0;
  rows.push({ ms, status: res.status, url });
}

rows.sort((a, b) => b.ms - a.ms);
console.log('\n=== ADMIN ENDPOINT TIMINGS (worst first) ===');
for (const r of rows) {
  const flag = r.ms > 500 ? ' *** SLOW' : '';
  console.log(`${String(r.ms).padStart(6)}ms [${r.status}] ${r.url}${flag}`);
}
console.log(`\nTotal: ${rows.length} endpoints`);
process.exit(0);