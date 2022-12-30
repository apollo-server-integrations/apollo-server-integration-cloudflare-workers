# @as-integrations/cloudflare-workers

This is an Apollo Server v4 integration for Cloudflare Workers.

## Demo

- Source: https://github.com/kimyvgy/worker-apollo-server-template
- Live demo: https://worker-apollo-server.webee-asia.workers.dev

## Install

```bash
npm install @apollo/server graphql @as-integrations/cloudflare-workers
```

## Usage

```typescript
import type { CloudflareWorkersHandler } from 'apollo-server-integration-cloudflare-workers';

import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { startServerAndCreateCloudflareWorkersHandler } from 'apollo-server-integration-cloudflare-workers';

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

const handleGraphQLRequest: CloudflareWorkersHandler = startServerAndCreateCloudflareHandler(server, {
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
