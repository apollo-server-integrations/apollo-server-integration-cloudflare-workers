import type { WithRequired } from '@apollo/utils.withrequired';
import type { ExecutionContext } from '@cloudflare/workers-types';

import {
  ApolloServer,
  BaseContext,
  ContextFunction,
  HeaderMap,
  HTTPGraphQLRequest,
} from '@apollo/server';

export type CloudflareWorkersHandler<TEnv> = (
  request: Request,
  env: TEnv,
  ctx: ExecutionContext,
) => Promise<Response>;

export interface CloudflareContextFunctionArgument<TEnv> {
  request: Request;
  env: TEnv;
  ctx: ExecutionContext;
}

export interface CloudflareWorkersHandlerOptions<
  TEnv,
  TContext extends BaseContext,
> {
  context?: ContextFunction<
    [CloudflareContextFunctionArgument<TEnv>],
    TContext
  >;
}

export function startServerAndCreateCloudflareWorkersHandler<TEnv>(
  server: ApolloServer<BaseContext>,
  options?: CloudflareWorkersHandlerOptions<TEnv, BaseContext>,
): CloudflareWorkersHandler<TEnv>;
export function startServerAndCreateCloudflareWorkersHandler<
  TEnv,
  TContext extends BaseContext,
>(
  server: ApolloServer<TContext>,
  options: WithRequired<
    CloudflareWorkersHandlerOptions<TEnv, TContext>,
    'context'
  >,
): CloudflareWorkersHandler<TEnv>;
export function startServerAndCreateCloudflareWorkersHandler<
  TEnv,
  TContext extends BaseContext,
>(
  server: ApolloServer<TContext>,
  options?: CloudflareWorkersHandlerOptions<TEnv, TContext>,
): CloudflareWorkersHandler<TEnv> {
  server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

  const defaultContext: ContextFunction<
    [CloudflareContextFunctionArgument<TEnv>],
    any
  > = async () => ({});

  const contextFunction: ContextFunction<
    [CloudflareContextFunctionArgument<TEnv>],
    TContext
  > = options?.context ?? defaultContext;

  return async function cloudflareWorkersHandler(
    request: Request,
    env: TEnv,
    ctx: ExecutionContext,
  ) {
    try {
      if (request.method === 'OPTIONS') {
        return new Response('', { status: 204 });
      }

      const httpGraphQLRequest = await normalizeIncomingRequest(request);

      const { body, headers, status } = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest: httpGraphQLRequest,
        context: () => contextFunction({ request, env, ctx }),
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
