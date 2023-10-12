import type { Config } from '@jest/types';

const testRegex = '/__tests__/.*.test.ts$';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['src'],
  transform: {
    [testRegex]: ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testRegex,
  verbose: true,
};

export default config;
