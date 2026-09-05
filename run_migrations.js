const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Please set the DATABASE_URL environment variable.");
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

const migrations = [
  'database/migrations/0000_core_foundation/001_core_schema.sql',
  'database/migrations/devB_attendance_timeoff/002_attendance_timeoff.sql',
  'database/migrations/devC_payroll_engine/003_payroll_engine.sql',
  'database/migrations/devD_reporting_platform/004_reporting_platform.sql'
];

async function runMigrations() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    for (const file of migrations) {
      const fullPath = path.join(__dirname, file);
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(fullPath, 'utf8');
      
      await client.query(sql);
      console.log(`Successfully executed ${file}\n`);
    }

    console.log('All migrations completed successfully.');
  } catch (err) {
    console.error('Error executing migrations:', err);
  } finally {
    await client.end();
  }
}

runMigrations();
