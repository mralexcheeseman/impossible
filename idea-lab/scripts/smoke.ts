import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const secret = randomBytes(32).toString('hex');
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'],
  {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      LAB_ACCESS_SECRET: secret,
      IDEA_LAB_DEMO: 'false',
    },
    stdio: 'ignore',
  },
);
const base = 'http://127.0.0.1:3100';
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      await fetch(base + '/login');
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  assert.ok(ready, 'Server must start');
  for (const route of ['/', '/ideas/fieldnote', '/preview/fieldnote']) {
    const r = await fetch(base + route, { redirect: 'manual' });
    assert.equal(r.status, 307);
    assert.ok(r.headers.get('location')?.endsWith('/login'));
  }
  const forbidden = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { origin: 'https://other.example' },
    body: new URLSearchParams({ password: secret }),
    redirect: 'manual',
  });
  assert.equal(forbidden.status, 403);
  const logged = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { origin: base },
    body: new URLSearchParams({ password: secret }),
    redirect: 'manual',
  });
  assert.equal(logged.status, 303);
  const cookie = logged.headers.get('set-cookie')!.split(';')[0];
  assert.ok(cookie.includes('idea_lab_session='));
  for (const route of [
    '/',
    '/ideas/fieldnote',
    '/preview/fieldnote',
    '/preview/signal-room',
    '/preview/small-hours',
  ]) {
    const r = await fetch(base + route, { headers: { cookie } });
    assert.equal(r.status, 200, route);
    const html = await r.text();
    assert.ok(html.includes('<h1'), route);
  }
  const missing = await fetch(base + '/ideas/does-not-exist', { headers: { cookie } });
  assert.equal(missing.status, 404);
  console.log(
    'Production smoke passed: protected routes, origin guard, login, three concept pages and missing-page handling.',
  );
} finally {
  server.kill('SIGTERM');
}
