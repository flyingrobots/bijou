import './scripts/docker-seal/require-docker.mjs';
import { defineConfig } from 'vitest/config';
import { sharedVitestConfig } from './scripts/vitest-shared-config.js';

export default defineConfig(sharedVitestConfig);
