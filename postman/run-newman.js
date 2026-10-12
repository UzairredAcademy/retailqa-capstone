/* Runs every Postman collection in postman/collections with Newman and writes reports to reports/newman. */
const fs = require('fs');
const path = require('path');
const newman = require('newman');

const collectionsDir = path.join(__dirname, 'collections');
const environment =
  process.env.NEWMAN_ENV || path.join(__dirname, 'environments', 'local.postman_environment.json');
const reportsDir = path.join(__dirname, '..', 'reports', 'newman');
fs.mkdirSync(reportsDir, { recursive: true });

const files = fs.readdirSync(collectionsDir).filter((f) => f.endsWith('.json'));
let failed = false;

const runNext = (i) => {
  if (i >= files.length) {
    process.exit(failed ? 1 : 0);
  }
  const file = files[i];
  const base = path.basename(file, '.json');
  newman.run(
    {
      collection: path.join(collectionsDir, file),
      environment,
      reporters: ['cli', 'htmlextra', 'json'],
      reporter: {
        htmlextra: { export: path.join(reportsDir, `${base}.html`) },
        json: { export: path.join(reportsDir, `${base}.json`) },
      },
    },
    (err, summary) => {
      if (err || summary.run.failures.length > 0) failed = true;
      runNext(i + 1);
    },
  );
};

runNext(0);
