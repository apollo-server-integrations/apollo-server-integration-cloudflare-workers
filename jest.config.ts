import type { Config } from '@jest/types';
import fetch, { Request, Headers, Response } from 'node-fetch';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['src'],
  globals: {
    fetch,
    Request,
    Headers,
    Response,
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testRegex: '/__tests__/.*.test.ts$',
  verbose: true,
};

export default config;
