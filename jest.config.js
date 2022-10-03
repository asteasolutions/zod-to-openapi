module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  setupFilesAfterEnv: ['<rootDir>/spec/setup-tests.ts'],
};
