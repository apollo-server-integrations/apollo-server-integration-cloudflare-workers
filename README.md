# @as-integrations/cloudflare-workers

[![NPM version](https://img.shields.io/npm/v/@as-integrations/cloudflare-workers.svg)](https://www.npmjs.com/package/@as-integrations/cloudflare-workers)

An integration to use Cloudflare Workers as a hosting service with Apollo Server.

## Quickstart

- Read the step-by-step tutorial: https://viblo.asia/p/y37Ldv3y4ov
- Checkout the repository template: https://github.com/kimyvgy/worker-apollo-server-template
- Live demo: https://worker-apollo-server.teguru.workers.dev

## Install

```bash
npm add @apollo/server @as-integrations/cloudflare-workers graphql
```

## Usage

You must enable Node.js compatibility feature by adding the following flag in the file `wrangler.toml`:

```toml
compatibility_flags = ["nodejs_compat"] # wrangler v4
# node_compat = true  # or wrangler v3
```

```typescript
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateCloudflareWorkersHandler } from '@as-integrations/cloudflare-workers';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

const typeDefs = `#graphql
  type Query {
    example: String!
  }
`;

const resolvers = {
  Query: {
    example: () => {
      return 'Hello universe!';
    },
  }
}

interface Context {
  token: string
}

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ],
});

export interface Env {
  // ...
}

export default {
  fetch: startServerAndCreateCloudflareWorkersHandler<Env, Context>(server, {
    context: async ({ env, request, ctx }) => {
      return { token: 'secret' };
    },
  }),
};
```

### Additional Bonus: Deno Support

This example works with [Deno](https://deno.com) because it follows Web API standards and supports [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). With Deno’s built-in [Deno.serve](https://docs.deno.com/api/deno/~/Deno.serve), you can run it with minimal changes.

**Important Notes:**

- If using Node.js packages, add an import map to `deno.json` or use the `npm:` prefix.
```typescript
# instead of:
import { ApolloServer } from '@apollo/server';

# we use:
import { ApolloServer } from 'npm:@apollo/server';
```
- For more control, modify the setup:
```typescript
type Env = {};
type Context = { token: string };

const handler = startServerAndCreateCloudflareWorkersHandler<Env, Context>(server, {
  context: async () => ({ token: 'secret' }),
});

Deno.serve({ port: 3000 }, (req) => handler(req, {} satisfies Env, { token: '' } satisfies Context));
```
- Live demo: [Deno Playground](https://dash.deno.com/playground/apollo-integration-example)
