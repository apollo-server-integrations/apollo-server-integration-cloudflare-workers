import type { WithRequired } from '@apollo/utils.withrequired';

import {
  ApolloServer,
  BaseContext,
  ContextFunction,
  HeaderMap,
  HTTPGraphQLRequest,
} from '@apollo/server';

export type CloudflareWorkersHandler = (request: Request) => Promise<Response>;

export interface CloudflareContextFunctionArgument {
  request: Request;
}

export interface CloudflareWorkersHandlerOptions<TContext extends BaseContext> {
  context?: ContextFunction<[CloudflareContextFunctionArgument], TContext>;
}

export function startServerAndCreateCloudflareWorkersHandler(
  server: ApolloServer<BaseContext>,
  options?: CloudflareWorkersHandlerOptions<BaseContext>,
): CloudflareWorkersHandler;
export function startServerAndCreateCloudflareWorkersHandler<
  TContext extends BaseContext,
>(
  server: ApolloServer<TContext>,
  options: WithRequired<CloudflareWorkersHandlerOptions<TContext>, 'context'>,
): CloudflareWorkersHandler;
export function startServerAndCreateCloudflareWorkersHandler<
  TContext extends BaseContext,
>(
  server: ApolloServer<TContext>,
  options?: CloudflareWorkersHandlerOptions<TContext>,
): CloudflareWorkersHandler {
  server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

  const defaultContext: ContextFunction<
    [CloudflareContextFunctionArgument],
    any
  > = async () => ({});

  const contextFunction: ContextFunction<
    [CloudflareContextFunctionArgument],
    TContext
  > = options?.context ?? defaultContext;

  return async (request: Request) => {
    try {
      if (request.method === 'OPTIONS') {
        return new Response('', { status: 204 });
      }

      const httpGraphQLRequest = await normalizeIncomingRequest(request);

      const { body, headers, status } = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest: httpGraphQLRequest,
        context: () => contextFunction({ request }),
      });

      if (body.kind === 'chunked') {
        throw Error('Incremental delivery not implemented');
      }

      return new Response(body.string, {
        status: status || 200,
        headers: {
          ...Object.fromEntries(headers),
          'content-length': Buffer.byteLength(body.string).toString(),
        },
      });
    } catch (e) {
      return new Response((e as Error).message, { status: 400 });
    }
  };
}

async function normalizeIncomingRequest(
  request: Request,
): Promise<HTTPGraphQLRequest> {
  const headers = normalizeHeaders(request.headers);
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  return {
    method,
    headers,
    body: method === 'GET' ? request.body : await request.json(),
    search: url.search ?? '',
  };
}

function normalizeHeaders(headers: Headers): HeaderMap {
  const headerMap = new HeaderMap();

  headers.forEach((value, key) => {
    headerMap.set(key, Array.isArray(value) ? value.join(', ') : value);
  });

  return headerMap;
}
