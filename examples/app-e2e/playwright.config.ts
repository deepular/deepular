import type { PlaywrightTestConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8080/';

export default {
  retries: 3,
  maxFailures: 2,
  timeout: 120000,
  use: {
    baseURL,
  },
} satisfies PlaywrightTestConfig;
