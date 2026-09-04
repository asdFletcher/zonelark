// Empty stand-in for the `server-only` package under Vitest.
// The provisioner is server-only in the app, but the test suite runs in a
// plain Node context where importing the real `server-only` module throws.
export {};
