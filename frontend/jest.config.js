export default {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', module: 'CommonJS', esModuleInterop: true } }] },
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react/jsx-runtime$': '<rootDir>/node_modules/react/jsx-runtime',
    '\\.css$': 'identity-obj-proxy',
    '^@pulse/ui$': '<rootDir>/../ui-library/src/index.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/main.tsx', '!src/setupTests.ts']
}
