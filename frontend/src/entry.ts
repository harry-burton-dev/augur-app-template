import { defineApp } from '@augur/mfe-sdk/sdk3';
import manifest from '../../manifest.json';
import type { Greeting } from '../../service/src/api-types.js';
import { ABOUT, API, COMMANDS, details, screen, why, type Asked } from './screen.js';

/**
 * What the shell runs in the app's worker (the manifest's `frontend.entry`): `start(ctx)`, once, with
 * the person, the floor and the calls the bridge carries. The shell draws the app bar, the rail and the
 * About panel from the manifest; the app fills the screen, its pane's title and actions, and its About
 * sections. A new floor starts the worker again, so nothing here outlives one floor.
 */
export default defineApp((ctx) => {
  let asked: Asked = { kind: 'asking' };
  const draw = () =>
    ctx.frame.screen.render(screen(asked, { askAgain: () => void ask(), notify: () => ctx.notify({ title: `Hello from ${manifest.name}` }) }));

  // Through the gateway, which adds the person's token, the floor and the app: the worker never sees them.
  const ask = async () => {
    asked = { kind: 'asking' };
    draw();
    try {
      const res = await ctx.fetch(`${API}/greeting`);
      asked = res.ok ? { kind: 'answered', greeting: (await res.json()) as Greeting } : { kind: 'failed', why: await why(res) };
    } catch (err) {
      asked = { kind: 'failed', why: (err as Error).message };
    }
    draw();
  };

  ctx.frame.set({ title: `Hello, ${ctx.person.name.split(' ')[0]}`, actions: [{ command: COMMANDS.again }] });
  ctx.frame.onCommand(COMMANDS.again, ask);
  ctx.frame.about(ABOUT.details).render(details(ctx));
  void ask();
});
