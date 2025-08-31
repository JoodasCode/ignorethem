const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    '!lib/**/*.d.ts',
  ],
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/lib/__tests__/**/!(performance-load|stress-testing|ai-performance|supabase-mcp-performance).test.{js,jsx,ts,tsx}'
      ],
      testEnvironment: 'jest-environment-jsdom',
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/lib/__tests__/**/*integration*.test.{js,jsx,ts,tsx}',
        '<rootDir>/app/api/**/__tests__/**/*.test.{js,jsx,ts,tsx}'
      ],
      testEnvironment: 'jest-environment-node',
    },
    {
      displayName: 'performance',
      testMatch: [
        '<rootDir>/lib/__tests__/**/performance-simple.test.{js,jsx,ts,tsx}'
      ],
      testEnvironment: 'jest-environment-node',
      testTimeout: 180000, // 3 minutes for performance tests
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
    {
      displayName: 'stress',
      testMatch: [
        '<rootDir>/lib/__tests__/**/stress-testing.test.{js,jsx,ts,tsx}'
      ],
      testEnvironment: 'jest-environment-node',
      testTimeout: 300000, // 5 minutes for stress tests
    },
    {
      displayName: 'e2e',
      testMatch: [
        '<rootDir>/lib/__tests__/**/e2e-*.test.{js,jsx,ts,tsx}'
      ],
      testEnvironment: 'jest-environment-node',
    }
  ]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)