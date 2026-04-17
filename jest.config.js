/** @type {import('ts-jest').JestConfigWithTsJest} */

// Env vars para que supabase.ts no explote al importarse
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJ0ZXN0IjoidGVzdCJ9.eyJ0ZXN0IjoidGVzdCJ9.test'

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testPathIgnorePatterns: ['__mocks__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '@react-native-async-storage/async-storage':
      '<rootDir>/__tests__/__mocks__/async-storage.ts',
    '@sentry/react-native':
      '<rootDir>/__tests__/__mocks__/sentry.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
}
