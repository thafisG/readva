type HeaderValue = string | string[] | undefined;

interface ApiRequest extends AsyncIterable<string | Uint8Array> {
  headers: Record<string, HeaderValue>;
  method?: string;
  url?: string;
}

interface ApiResponse {
  writeHead(status: number, headers?: Record<string, string | string[]>): void;
  end(body?: string | Uint8Array): void;
}

declare const process: {
  env: Record<string, string | undefined>;
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
): Promise<void> {
  const apiOrigin = process.env['READVA_API_URL'];
  if (!apiOrigin) {
    sendJson(response, 503, {
      message: 'A API ainda não foi configurada para este ambiente.',
    });
    return;
  }

  let destination: URL;
  try {
    const incomingUrl = new URL(request.url ?? '/', 'http://vercel.local');
    const apiPath = incomingUrl.searchParams.get('path');
    if (!apiPath || apiPath.split('/').some((segment) => segment === '..')) {
      sendJson(response, 400, { message: 'A rota da API é inválida.' });
      return;
    }

    destination = new URL(`/api/${apiPath}`, apiOrigin);
    incomingUrl.searchParams.delete('path');
    destination.search = incomingUrl.searchParams.toString();
    if (!['http:', 'https:'].includes(destination.protocol)) {
      throw new Error('Unsupported protocol');
    }
  } catch {
    sendJson(response, 500, { message: 'A URL da API configurada é inválida.' });
    return;
  }

  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (value && !HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
        headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const method = request.method ?? 'GET';
    const body = ['GET', 'HEAD'].includes(method) ? undefined : await readBody(request);
    const upstream = await fetch(destination, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(25_000),
    });

    const responseHeaders: Record<string, string | string[]> = {};
    upstream.headers.forEach((value, name) => {
      if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase()) && name.toLowerCase() !== 'set-cookie') {
        responseHeaders[name] = value;
      }
    });
    const cookies = upstream.headers.getSetCookie();
    if (cookies.length > 0) responseHeaders['set-cookie'] = cookies;
    responseHeaders['cache-control'] = 'no-store';

    response.writeHead(upstream.status, responseHeaders);
    if (method === 'HEAD' || upstream.status === 204 || upstream.status === 304) {
      response.end();
      return;
    }
    response.end(new Uint8Array(await upstream.arrayBuffer()));
  } catch {
    sendJson(response, 502, {
      message: 'Não foi possível conectar à API. Verifique o serviço de backend.',
    });
  }
}

async function readBody(request: ApiRequest): Promise<ArrayBuffer | undefined> {
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  for await (const chunk of request) {
    const bytes = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : new Uint8Array(chunk);
    chunks.push(bytes);
    byteLength += bytes.byteLength;
  }

  if (chunks.length === 0) return undefined;

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body.buffer;
}

function sendJson(response: ApiResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}
