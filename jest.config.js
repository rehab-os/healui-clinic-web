const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // Handle module aliases (match your tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/components/features/(.*)$': '<rootDir>/src/components/features/$1',
    '^@/components/ui/(.*)$': '<rootDir>/src/components/ui/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/data/(.*)$': '<rootDir>/src/data/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/types/(.*)$': '<rootDir>/src/lib/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/lib/utils/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/app/**', // Exclude Next.js app directory (mostly routing)
  ],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
    '/e2e/', // E2E tests run separately with Playwright
  ],

  // Transform is handled by next/jest automatically
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
