import type { QuillRemoteElementName, QuillRemoteEvents, QuillRemoteProperties } from '@augur/app-kit/remote';
import type { AppContext, RemoteElement, RemoteNode } from '@augur/mfe-sdk/sdk3';
import manifest from '../../manifest.json';
import type { Greeting } from '../../service/src/api-types.js';

/**
 * What the app draws: Quill's remote elements by name, with their props (`@augur/app-kit/remote` types
 * them; nothing of the kit is bundled). The shell draws them with the real kit and drops anything else.
 * A prop `on<Event>` hears that event: `onPress` on a `quill-button`, `onAction` on a `quill-state`.
 */
type Handlers<N extends QuillRemoteElementName> = {
  [E in keyof QuillRemoteEvents[N] & string as `on${Capitalize<E>}`]?: (detail: QuillRemoteEvents[N][E]) => void;
};
export const quill = <N extends QuillRemoteElementName>(type: N, props: QuillRemoteProperties[N] & Handlers<N>, children?: RemoteNode): RemoteElement => ({
  type,
  props,
  ...(children === undefined ? {} : { children }),
});

/** The commands and About sections the app handles: each is declared in manifest.json, which the shell draws from. */
export const COMMANDS = { again: 'greeting.again' } as const;
export const ABOUT = { details: 'details' } as const;

/** Where the gateway sends the app's calls: its own inbound part, at its manifest id. */
export const API = `/api/${manifest.id}/v1`;

/** What the screen shows of the service's answer. */
export type Asked = { kind: 'asking' } | { kind: 'answered'; greeting: Greeting } | { kind: 'failed'; why: string };

/** The screen's main content. */
export const screen = (asked: Asked, on: { askAgain: () => void; notify: () => void }): RemoteNode => [
  quill(
    'quill-section',
    { label: 'From the service' },
    asked.kind === 'asking'
      ? quill('quill-state', { kind: 'loading', heading: 'Asking the service', size: 'line' })
      : asked.kind === 'failed'
        ? quill('quill-state', { kind: 'error', heading: 'The service didn’t answer', body: asked.why, action: 'Try again', size: 'line', onAction: on.askAgain })
        : quill('quill-notice', { tone: 'info' }, asked.greeting.message),
  ),
  quill('quill-button', { label: 'Send a notification', kind: 'secondary', onPress: on.notify }),
];

/** The About panel's Details section: what this is, on which floor. */
export const details = (ctx: AppContext): RemoteNode =>
  quill('quill-details', {
    items: [
      { label: 'Version', value: manifest.version },
      { label: 'Floor', value: ctx.workspace.name },
    ],
  });

/** Why a call failed, from the problem details body every AUGUR service answers with (`detail` is the sentence). */
export const why = async (res: Response): Promise<string> => {
  const problem = (await res.json().catch(() => undefined)) as { detail?: string; message?: string } | undefined;
  return problem?.detail ?? problem?.message ?? `The service answered ${res.status}.`;
};
