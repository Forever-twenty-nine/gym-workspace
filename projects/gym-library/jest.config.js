module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  verbose: true,
  expand: true,
  transform: {
    '^.+\\.(ts|js|html)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  testMatch: [
    '<rootDir>/src/**/*.spec.ts'
  ],
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  moduleNameMapper: {
    '@angular/core': '<rootDir>/__mocks__/@angular/core.ts',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts'
  ],
};