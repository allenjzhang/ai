/**
 * Vitest setup for unit tests.
 */
import { beforeAll, afterAll, vi } from "vitest";

beforeAll(() => {
  // Optional: global test setup
});

afterAll(() => {
  vi.restoreAllMocks();
});
