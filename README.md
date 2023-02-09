# @as-integrations/cloudflare-workers

[![NPM version](https://img.shields.io/npm/v/@as-integrations/cloudflare-workers.svg)](https://www.npmjs.com/package/@as-integrations/cloudflare-workers)

An integration to use Cloudflare Workers as a hosting service with Apollo Server.

## Install

```bash
npm install @apollo/server graphql @as-integrations/cloudflare-workers
```

## Usage

```typescript
import type { CloudflareWorkersHandler } from '@as-integrations/cloudflare-workers';

import { ApolloServer } from '@apollo/server';
import { startServerAndCreateCloudflareWorkersHandler } from '@as-integrations/cloudflare-workers';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

interface ApolloDataSources {
  pokemonAPI: PokemonAPI;
}

interface ContextValue {
  token: string;
  dataSources: ApolloDataSources;
};

const server = new ApolloServer<ContextValue>({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    // ApolloServerPluginLandingPageProductionDefault({
    //   graphRef: 'my-graph-id@my-graph-variant',
    //   footer: false,
    // })
  ],
});

const handleGraphQLRequest: CloudflareWorkersHandler = startServerAndCreateCloudflareWorkersHandler(server, {
  context: async ({ request }) => {
    const token = request.headers.token || '';
    const cache = server.cache;

    const dataSources: ApolloDataSources = {
      pokemonAPI: new PokemonAPI({ cache, token }),
    };

    return { dataSources, token };
  },
});

// 1. ServiceWorker syntax:
// --------------------------------------------------------------------
addEventListener((e) => handleGraphQLRequest(e.request as Request));
// --------------------------------------------------------------------

// 2. Or ModuleWorker syntax:
// --------------------------------------------------------------------
// export default {
//   fetch(request) {
//     return handleGraphQLRequest(request);
//   },
// };
```

## Demo

- Source: https://github.com/kimyvgy/worker-apollo-server-template
- Live demo: https://worker-apollo-server.webee-asia.workers.dev
