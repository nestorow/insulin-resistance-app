import "@testing-library/jest-dom";

// Deterministic AES-256 key for tests. 32 bytes ('a' repeated 64 hex chars).
// Anchored here so every test file inherits it and the encryption suite
// doesn't need its own bootstrap. Prod uses a real random key in env.
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? "a".repeat(64);
