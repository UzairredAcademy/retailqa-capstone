import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotsFolder: 'reports/cypress/screenshots',
    defaultCommandTimeout: 8000,
    retries: { runMode: 1, openMode: 0 },
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: 'reports/cypress',
      charts: true,
      reportPageTitle: 'RetailQE Cypress Report',
      embeddedScreenshots: true,
      inlineAssets: true,
    },
    setupNodeEvents(on) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('cypress-mochawesome-reporter/plugin')(on);
    },
  },
});
