// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom')

// Load environment variables for testing
const { loadEnvConfig } = require('@next/env')

const projectDir = process.cwd()
loadEnvConfig(projectDir)

// Add fetch polyfill for Stripe
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
)