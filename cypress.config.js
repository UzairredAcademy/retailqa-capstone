const { defineConfig } = require('cypress');

let hasMochawesome = false;
try {
  require.resolve('cypress-mochawesome-reporter');
  hasMochawesome = true;
} catch {
  hasMochawesome = false;
}

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'reports/cypress/screenshots',
    defaultCommandTimeout: 8000,
    retries: { runMode: 1, openMode: 0 },
    env: { apiUrl: 'http://localhost:4000/api' },
    reporter: hasMochawesome ? 'cypress-mochawesome-reporter' : 'spec',
    reporterOptions: {
      reportDir: 'reports/cypress',
      charts: true,
      reportPageTitle: 'RetailQE Cypress Report',
      embeddedScreenshots: true,
      inlineAssets: true,
    },
    setupNodeEvents(on) {
      if (hasMochawesome) require('cypress-mochawesome-reporter/plugin')(on);

      // Lets a spec run a read-only SQL query: cy.task('sql', { query, params })
      on('task', {
        async sql({ query, params = {} }) {
          const mssql = require('mssql');
          const pool = await new mssql.ConnectionPool({
            server: 'localhost',
            port: 1433,
            user: 'sa',
            password: process.env.SQL_PASSWORD || 'RetailQE_Str0ng!2026',
            database: 'RetailQEDb',
            options: { encrypt: false, trustServerCertificate: true },
          }).connect();
          try {
            const request = pool.request();
            Object.entries(params).forEach(([name, value]) => request.input(name, value));
            const result = await request.query(query);
            return result.recordset || [];
          } finally {
            await pool.close();
          }
        },
      });
    },
  },
});