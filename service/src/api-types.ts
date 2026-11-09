// The app's wire types, written once. The service answers with them, its OpenAPI document (openapi.ts)
// describes them and the frontend reads them (frontend/src/screen.ts imports this file), so none of
// the three can drift from the others (AUGUR's ADR 0055).

/** `GET /v1/greeting`: who the service knows is calling, and on which floor. */
export interface Greeting {
  message: string;
  /** The floor the call was made on, as the gateway signed it. */
  floor?: { id: string; kind: 'personal' | 'team' | 'org' };
}

/** `Greeting` as JSON Schema: the route's response schema and the OpenAPI document's. */
export const greetingSchema = {
  type: 'object',
  required: ['message'],
  additionalProperties: false,
  properties: {
    message: { type: 'string' },
    floor: {
      type: 'object',
      required: ['id', 'kind'],
      additionalProperties: false,
      properties: { id: { type: 'string' }, kind: { type: 'string', enum: ['personal', 'team', 'org'] } },
    },
  },
} as const;
