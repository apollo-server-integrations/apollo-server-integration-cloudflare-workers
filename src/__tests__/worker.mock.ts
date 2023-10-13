import type {
  IncomingMessage,
  ServerResponse,
  RequestListener,
  Server,
} from 'http';
import type { AddressInfo } from 'net';
import type { CloudflareWorkersHandler } from '../';

// Stolen from apollo server integration tests
export function urlForHttpServer(httpServer: Server): string {
  const { address, port } = httpServer.address() as AddressInfo;

  // Convert IPs which mean "any address" (IPv4 or IPv6) into localhost
  // corresponding loopback ip. Note that the url field we're setting is
  // primarily for consumption by our test suite. If this heuristic is wrong for
  // your use case, explicitly specify a frontend host (in the `host` option
  // when listening).
  const hostname = address === '' || address === '::' ? 'localhost' : address;
  const format = (urlObject: Object) =>
    String(Object.assign(new URL('http://localhost'), urlObject));

  return format({
    protocol: 'http',
    hostname,
    port,
    pathname: '/',
  });
}

export function toNodeRequestListener(
  handler: CloudflareWorkersHandler,
): RequestListener<typeof IncomingMessage, typeof ServerResponse> {
  return async (req: IncomingMessage, res: ServerResponse) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      const result = await handler(
        new Request(`http://localhost${req.url}`, {
          body,
          method: req.method,
          headers: req.headers as HeadersInit,
        }),
      );

      result.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      res.statusCode = result.status;
      res.write(result.body);
      res.end();
    });
  };
}
