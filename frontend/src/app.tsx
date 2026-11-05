import { AppError, Button, DataView, PageHead, Section, place, placeRoutes, useAppContext, useData, type AppProps } from '@augur/app-kit';
import type { MountContext } from '@augur/mfe-sdk';
import manifest from '../../manifest.json';
import type { Greeting } from '../../service/src/api-types.js';

/** Where the gateway sends this app's calls: its own service, at its manifest id. */
export const API = `/api/${manifest.id}/v1`;

/** Asks the app's service, through the gateway, with the person's token and floor (`ctx.fetch`). */
const greeting = async (ctx: MountContext, signal: AbortSignal): Promise<Greeting> => {
  const res = await ctx.fetch(`${API}/greeting`, { signal });
  if (!res.ok) throw AppError.fromProblem(res.status, await res.json().catch(() => undefined), { appName: manifest.name });
  return (await res.json()) as Greeting;
};

/** The app's front page. Add places beside it in `places`, below. */
function Front() {
  const ctx = useAppContext<MountContext>();
  // Loaded once per floor and kept while the app is open. `refreshOn: ['<id>.<thing>.<happened>']`
  // loads it again when the app's service publishes that domain event.
  const state = useData(['greeting'], (signal) => greeting(ctx, signal));
  return (
    <>
      <PageHead eyebrow={manifest.name} heading={`Hello, ${ctx.user.name.split(' ')[0]}`} summary={manifest.description} />
      <Section label="From the service" count={-1}>
        <DataView state={state} loading="Asking the service" failed="The service didn’t answer">
          {(g) => <p>{g.message}</p>}
        </DataView>
      </Section>
      <div>
        <Button kind="secondary" onPress={() => ctx.notify({ title: `Hello from ${manifest.name}` })}>
          Send a notification
        </Button>
      </div>
    </>
  );
}

/** The app's places on the address bar, below its route: `/` is the front page. */
export const places = placeRoutes({
  front: place('/', Front),
});

/** The app's frame. With `routes`, the place on screen comes as `children`. */
export function App({ children }: AppProps<MountContext>) {
  return <main className="starter">{children}</main>;
}
