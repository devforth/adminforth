export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // suites share tests/application/.db.sqlite and AdminForth allows one instance per process
  maxWorkers: 1,
  extensionsToTreatAsEsm: ['.ts'],
  resolver: './resolver.cjs',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, diagnostics: false }],
  },

  transformIgnorePatterns: [
    'node_modules/(?!adminforth)'
  ],
};