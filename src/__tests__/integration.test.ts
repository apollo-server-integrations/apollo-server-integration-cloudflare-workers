import { defineIntegrationTestSuite } from '@apollo/server-integration-testsuite';
import { ApolloServer } from '@apollo/server';
import { createServer } from 'http';
import { startServerAndCreateCloudflareWorkersHandler } from '../';
import { toNodeRequestListener, urlForHttpServer } from './worker.mock';

describe('Cloudflare Workers integration tests', () => {
  defineIntegrationTestSuite(
    async (config, options) => {
      const apolloServer = new ApolloServer(config);
      const httpServer = createServer(
        toNodeRequestListener(
          startServerAndCreateCloudflareWorkersHandler(apolloServer, options),
        ),
      );

      await new Promise<void>((resolve) => {
        httpServer.listen({ port: 0 }, resolve);
      });

      return {
        server: apolloServer,
        url: urlForHttpServer(httpServer),
        async extraCleanup() {
          await new Promise<void>((resolve) => {
            httpServer.close(() => resolve());
          });
        },
      };
    },
    {
      serverIsStartedInBackground: true,
      noIncrementalDelivery: true,
    },
  );
});
