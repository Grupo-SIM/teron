module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@hcengineering/platform-rig/profiles/ui/svelte$': '<rootDir>/src/__mocks__/platformRig.ts',
    '^svelte/store$': '<rootDir>/src/__mocks__/svelteStore.ts',
    '\\.svelte$': '<rootDir>/src/__mocks__/svelteComponent.ts'
  }
}
