// @ts-check
import { defineConfig } from 'astro/config';
import pwa from './integrations/pwa.mjs';

// https://astro.build/config
export default defineConfig({ integrations: [pwa()] });
