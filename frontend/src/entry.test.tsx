import { fakeContext } from '@augur/mfe-sdk/testing';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import manifest from '../../manifest.json';
import { API } from './app.js';
import app from './entry.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The service, as the app sees it through the gateway: the fake shell's `ctx.fetch` ends here. For a
// service with an OpenAPI document, `contractHandlers` (same package, with MSW) answers from it instead.
const answering = (status = 200): typeof fetch => async (input) => {
  if (!String(input).endsWith(`${API}/greeting`)) return new Response(null, { status: 404 });
  return status === 200 ? Response.json({ message: 'The service knows you as Test Person.' }) : new Response(null, { status });
};

/** Lets the router, React and the data cache settle. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await act(async () => new Promise((r) => setTimeout(r, 0)));
};

let el: HTMLElement;
beforeEach(() => {
  el = document.createElement('div');
  document.body.replaceChildren(el);
  window.history.replaceState(null, '', `/@me${manifest.route}`);
});

describe('the app', () => {
  it("shows what its service says, and clears up on unmount", async () => {
    const ctx = fakeContext({ fetch: answering() });
    await act(async () => app.mount(el, ctx));
    await settle();
    expect(el.textContent).toContain('Hello, Test');
    expect(el.textContent).toContain('The service knows you as Test Person.');
    await act(async () => app.unmount(el));
    expect(el.textContent).toBe('');
  });

  it("says so when the service isn't answering", async () => {
    // The app keeps what it loaded for each floor across mounts, so this one asks on a floor of its own.
    await act(async () => app.mount(el, fakeContext({ fetch: answering(502), workspace: { id: 'ws-down' } })));
    await settle();
    expect(el.textContent).toContain(`${manifest.name} isn’t answering`);
    await act(async () => app.unmount(el));
  });

  it('sends a notification through the shell', async () => {
    const ctx = fakeContext({ fetch: answering() });
    await act(async () => app.mount(el, ctx));
    await settle();
    const button = [...el.querySelectorAll('button')].find((b) => b.textContent === 'Send a notification')!;
    await act(async () => button.click());
    expect(ctx.notified).toEqual([{ title: `Hello from ${manifest.name}` }]);
    await act(async () => app.unmount(el));
  });
});
