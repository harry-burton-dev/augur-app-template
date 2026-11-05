import { defineReactApp } from '@augur/app-kit';
import type { MountContext } from '@augur/mfe-sdk';
import manifest from '../../manifest.json';
import { App, places } from './app.js';
import styles from './styles.css?inline';

/** What the shell mounts at the app's route. Add a `Glance` for a card on Home, or a `Picker` to answer requests. */
export default defineReactApp<MountContext>({ name: manifest.name, App, routes: places, styles });
