import type { Config } from "jest";
import nextJest from "next/jest.js";

// Mirrors the thyroid-rehab pattern. `next/jest` handles transforms via
// SWC (no ts-jest needed) and wires up Next.js conventions automatically.

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

export default createJestConfig(config);
