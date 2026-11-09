import { loadConfig, statementTimeoutMs, steadyPool } from '@augur/service-kit';
import pg from 'pg';

/**
 * The app's own database, as the runner hands it (the `augur-database` resource in the Score files):
 * the login `app_<id>`, whose search_path is the app's schema, so unqualified tables land there. The
 * password arrives only as a file (DATABASE_PASSWORD_FILE), never in a variable. Without DATABASE_HOST,
 * as under `pnpm dev:app`, there is none.
 */
export const databaseFromEnv = (service: string, env: NodeJS.ProcessEnv = process.env) => {
  if (!env.DATABASE_HOST) return undefined;
  loadConfig(service, [{ name: 'DATABASE_PASSWORD', about: 'the app’s database password, as a file', required: true, secret: true }], env);
  const schema = env.DATABASE_SCHEMA;
  if (!schema) throw new Error('DATABASE_SCHEMA is not set: the runner gives it with the database.');
  const pool = steadyPool(new pg.Pool({
    host: env.DATABASE_HOST,
    port: Number(env.DATABASE_PORT || 5432),
    database: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    max: Number(env.DATABASE_CONNECTIONS || 0) || undefined,
  }), undefined, statementTimeoutMs(env));
  return { pool, schema };
};
