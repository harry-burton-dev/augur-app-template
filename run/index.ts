// Starter's scenarios for AUGUR's run suite (the augur-run repository, AUGUR's ADR 0050): what a person
// does with the app in the proving run, and what shows it worked. The suite reads `scenarios` from here.
// Give each one the next free RUN id from augur-run's traceability.md, add its row there, and mark it
// `ready` once the suite can drive it.

export interface AppScenario {
  /** `RUN-<nn>`, from augur-run's traceability.md. */
  id: string;
  title: string;
  /** The alpha goal it proves. */
  goal: string;
  /** `waiting` until the steps can be driven. */
  status: 'ready' | 'waiting';
  /** What the person does, in order. */
  steps: string[];
  /** What the run records as evidence that it worked. */
  proof: string;
}

export const scenarios: AppScenario[] = [
  {
    id: 'RUN-??',
    title: 'Open Starter and hear from its service',
    goal: 'An app made from the template works in a real deployment',
    status: 'waiting',
    steps: [
      'Sign in',
      'Open Starter from the app bar',
      'Read the greeting its service gives, by the person’s name',
      'Run its Ask again command from the command palette, and read the greeting again',
      'Open its About panel and read its Details',
      'Send a notification and find it in the stream',
    ],
    proof: 'A screenshot of the greeting and the About panel, the gateway’s record of the two calls to /api/starter/v1/greeting, and the notification in the stream',
  },
];
