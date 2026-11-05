import { callerCheckFor, callerHeaders, callerSigner, signedCallerHeaders } from '@augur/service-kit';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';

const sam = { id: 'u1', name: 'Sam Okafor', departments: [], roles: [] };

describe('the service', () => {
  it('reports healthy', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', version: expect.stringMatching(/^\d+\.\d+\.\d+/), api: 'v1' });
  });

  it('greets the person the gateway passed on', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/v1/greeting', headers: callerHeaders(sam) });
    expect(res.json().message).toMatch(/Sam Okafor/);
  });

  it('believes only the caller the gateway signed for it', async () => {
    const gateway = callerSigner();
    const app = await buildApp({ callers: callerCheckFor(gateway, 'starter') });
    const signed = await app.inject({ remoteAddress: '172.18.0.9', method: 'GET', url: '/v1/greeting', headers: await signedCallerHeaders(gateway, sam, 'starter') });
    expect(signed.json().message).toMatch(/Sam Okafor/);
    const forged = await app.inject({ remoteAddress: '172.18.0.9', method: 'GET', url: '/v1/greeting', headers: callerHeaders(sam) });
    expect(forged.statusCode).toBe(401);
    const forAnother = await app.inject({ remoteAddress: '172.18.0.9', method: 'GET', url: '/v1/greeting', headers: await signedCallerHeaders(gateway, sam, 'identity') });
    expect(forAnother.statusCode).toBe(401);
  });

  it('refuses a call with no one signed in, as a problem details body', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/v1/greeting' });
    expect(res.statusCode).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  });
});
