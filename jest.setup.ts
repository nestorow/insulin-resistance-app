import "@testing-library/jest-dom";

// Deterministic AES-256 key for tests. 32 bytes ('a' repeated 64 hex chars).
// Anchored here so every test file inherits it and the encryption suite
// doesn't need its own bootstrap. Prod uses a real random key in env.
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? "a".repeat(64);

// @libsql/client ships ESM; any test that transitively imports the db
// module (e.g. via @/lib/audit, server actions) would crash on top-level
// `export` syntax. We never exercise a real DB in tests, so a noop
// createClient is sufficient — individual tests that need DB behavior
// mock @/lib/db directly via jest.mock at the file level.
jest.mock("@libsql/client", () => ({
  createClient: () => ({
    execute: jest.fn(async () => ({ rows: [] })),
    executeMultiple: jest.fn(async () => undefined),
    batch: jest.fn(async () => []),
  }),
}));
