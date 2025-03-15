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

## Additional bonus Deno support

- The above example can be run with `deno serve`
### How?
This integration is compatible with [Deno runtime](https://deno.com/). The reason is because Deno implements Web API standards and so [default `fetch` export for serving http requests](https://docs.deno.com/api/deno/~/Deno.ServeDefaultExport). And this is exactly what this repository provide for integration. So example above can be successfully run without any changes _(don't forget to add imports map to `deno.json` or add `npm:` prefix to imports)_.
- Live demo (with code in place): https://dash.deno.com/playground/apollo-integration-example
- For case when the more control is required you can rewrite it to something like this
```ts
// ...

const handler = startServerAndCreateCloudflareWorkersHandler<Env, Context>(server, {
  context: async ({ env, request, ctx }) => {
    return { token: 'secret' };
  },
});

Deno.serve({ port: 3000 }, (req) => {
  return handler(req, {} satisfies Env, { secret: '' } satisfies Context);
});
```
