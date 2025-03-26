/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Specify that we're using ts-jest for TypeScript files
  preset: 'ts-jest',
  
  // The test environment (node for backend testing)
  testEnvironment: 'node',
  
  // File patterns for test files
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // Module file extensions to handle
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ]
}; 