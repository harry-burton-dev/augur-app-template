// The app's wire types, written once. The service answers with them and the frontend reads them
// (frontend/src/app.tsx imports this file), so the two can't drift apart (AUGUR's ADR 0055).

/** `GET /v1/greeting`: who the service knows is calling, and on which floor. */
export interface Greeting {
  message: string;
  /** The floor the call named (`X-Workspace-Id`), when it named one the person is on. */
  floor?: { id: string; kind: 'personal' | 'team' | 'org' };
}
