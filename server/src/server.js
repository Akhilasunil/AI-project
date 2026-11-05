import './config/loadEnv.js';
import { app } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { assertRuntimeEnv } from './config/env.js';

try {
  assertRuntimeEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

try {
  await connectDb(process.env.MONGODB_URI);
} catch {
  console.error('Could not connect to MongoDB. Check MONGODB_URI and that the database is running.');
  process.exit(1);
}

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => {
  console.log(`Company AI API listening on http://localhost:${port}`);
});

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
