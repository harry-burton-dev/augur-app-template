import type { AppContext, FrameState, Notice, RemoteElement, RemoteNode } from '@augur/mfe-sdk/sdk3';
import { describe, expect, it } from 'vitest';
import manifest from '../../manifest.json';
import start from './entry.js';

// The shell, as the app sees it from its worker: what it draws in each root, what it sets on its pane,
// the commands it handles and what it tells the person. Its `ctx.fetch` ends at `answer`, standing in
// for the gateway and the app's service.
const fakeShell = (answer: (path: string) => Response) => {
  const shell = {
    screen: undefined as RemoteNode,
    about: new Map<string, RemoteNode>(),
    pane: {} as FrameState,
    commands: new Map<string, (detail?: unknown) => unknown>(),
    notified: [] as Notice[],
    fetched: [] as string[],
  };
  const root = (put: (node: RemoteNode) => void) => ({ render: put, clear: () => put(null) });
  const ctx: AppContext = {
    person: { id: 'p1', name: 'Test Person' },
    workspace: { id: 'ws-me', kind: 'personal', name: 'You' },
    path: '/',
    surface: 'screen',
    onNavigate: () => () => undefined,
    navigate: () => undefined,
    fetch: async (path) => {
      shell.fetched.push(path);
      return answer(path);
    },
    frame: {
      screen: root((node) => (shell.screen = node)),
      about: (id) => root((node) => shell.about.set(id, node)),
      card: root(() => undefined),
      set: (state) => Object.assign(shell.pane, state),
      under: () => undefined,
      onCommand: (id, handler) => {
        shell.commands.set(id, handler);
        return () => shell.commands.delete(id);
      },
    },
    files: { upload: async () => new Response(null, { status: 501 }), download: async () => undefined, onDrop: () => () => undefined },
    raise: async () => undefined,
    request: async () => Promise.reject(new Error('No app answers that here.')),
    notify: (notice) => void shell.notified.push(notice),
    previewOn: () => false,
  };
  return { ctx, shell };
};

const greeting = (message: string) => () => Response.json({ message });
// Services answer every error as problem details (RFC 9457): `detail` is the sentence a person reads.
const refusal = (status: number, detail: string) => () =>
  Response.json({ type: 'about:blank', title: 'Forbidden', status, reason: 'forbidden', detail }, { status, headers: { 'content-type': 'application/problem+json' } });

/** Every element in a tree, depth first. */
const elements = (node: RemoteNode): RemoteElement[] =>
  Array.isArray(node) ? node.flatMap(elements) : node && typeof node === 'object' ? [node, ...elements(node.children)] : [];
const text = (node: RemoteNode) => JSON.stringify(node);
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('the app', () => {
  it('asks its own service through the gateway, and shows what it says', async () => {
    const { ctx, shell } = fakeShell(greeting('Hello, Test Person.'));
    await start(ctx);
    await settle();
    expect(shell.fetched).toEqual([`/api/${manifest.id}/v1/greeting`]);
    expect(text(shell.screen)).toContain('Hello, Test Person.');
    expect(shell.pane.title).toContain('Test');
    // It draws only Quill's remote vocabulary, by name.
    expect(elements(shell.screen).every((e) => e.type.startsWith('quill-'))).toBe(true);
  });

  it('says why when the service refuses', async () => {
    const { ctx, shell } = fakeShell(refusal(403, 'Only this floor’s leads can see it.'));
    await start(ctx);
    await settle();
    expect(text(shell.screen)).toContain('Only this floor’s leads can see it.');
  });

  it('asks again on its command, which its pane offers', async () => {
    const { ctx, shell } = fakeShell(greeting('Hello.'));
    await start(ctx);
    await settle();
    const declared = manifest.contributes.commands.map((c) => c.id);
    expect([...shell.commands.keys()].every((id) => declared.includes(id))).toBe(true);
    expect(shell.pane.actions?.map((a) => a.command)).toEqual([...shell.commands.keys()]);
    await shell.commands.get(shell.pane.actions![0]!.command)!();
    expect(shell.fetched).toHaveLength(2);
  });

  it('sends a notification through the shell', async () => {
    const { ctx, shell } = fakeShell(greeting('Hello.'));
    await start(ctx);
    await settle();
    const button = elements(shell.screen).find((e) => e.type === 'quill-button')!;
    (button.props!.onPress as () => void)();
    expect(shell.notified).toEqual([{ title: `Hello from ${manifest.name}` }]);
  });

  it('fills each About section its manifest declares', async () => {
    const { ctx, shell } = fakeShell(greeting('Hello.'));
    await start(ctx);
    await settle();
    expect([...shell.about.keys()]).toEqual(manifest.contributes.about.map((a) => a.id));
    expect(text(shell.about.get(manifest.contributes.about[0]!.id))).toContain(manifest.version);
  });
});
