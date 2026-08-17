import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Integration tests share one real Postgres test DB and call resetDb()
    // (a full-table truncate) per test. Running test files in parallel lets
    // one file's resetDb() wipe rows another file's in-flight test depends
    // on, causing flaky unique-constraint / null-read failures. Force files
    // to run sequentially to keep the shared DB state deterministic.
    fileParallelism: false,
  },
});
