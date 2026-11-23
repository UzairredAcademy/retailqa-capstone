const { defineConfig } = require('cypress');

// Use the mochawesome HTML report when it is installed (npm install), otherwise the plain spec reporter.
let hasMochawesome = false;
try {
  require.resolve('cypress-mochawesome-reporter');
  hasMochawesome = true;
} catch {
  hasMochawesome = false;
}

module.exports = defineConfig({
  e2e: {
    // Web app: http://localhost:5173 (override with CYPRESS_BASE_URL)
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'reports/cypress/screenshots',
    defaultCommandTimeout: 8000,
    retries: { runMode: 1, openMode: 0 },
    env: {
      // REST API used for arranging test data and verification (override in cypress.env.json)
      apiUrl: 'http://localhost:4000/api',
    },
    reporter: hasMochawesome ? 'cypress-mochawesome-reporter' : 'spec',
    reporterOptions: {
      reportDir: 'reports/cypress',
      charts: true,
      reportPageTitle: 'RetailQE Cypress Report',
      embeddedScreenshots: true,
      inlineAssets: true,
    },
    setupNodeEvents(on) {
      if (hasMochawesome) {
        require('cypress-mochawesome-reporter/plugin')(on);
      }
    },
  },
});
