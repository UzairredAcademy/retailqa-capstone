const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      config.expose = {
        ...config.expose,
        apiUrl: config.env.apiUrl || 'http://localhost:4000/api',
        API_BASE_URL: config.env.API_BASE_URL || 'http://localhost:5000/api',
        agedOrderId: config.env.agedOrderId || '',
        keepData: config.env.keepData === true || config.env.keepData === 'true',
        xbrAny: config.env.xbrAny === true || config.env.xbrAny === 'true',
      };
      return config;
    },
  },
});
