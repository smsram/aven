import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '../windowService';

export interface HttpResponseWrapper {
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  ok: boolean;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

/**
 * Universal AI fetch transport:
 * 1. Inside Tauri desktop app: Uses native Windows execution via Rust (zero CORS, identical to curl in cmd).
 * 2. In browser / Vite dev mode: Routes Cloudflare requests via `/cf-ai-proxy` to bypass Cloudflare's 405 OPTIONS rejection.
 */
export async function safeAiFetch(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  } = {}
): Promise<HttpResponseWrapper> {
  const method = options.method || 'POST';
  const headers = options.headers || {};
  const body = options.body;

  // 1. If running inside Tauri native desktop application, execute via native Rust command
  if (isTauri()) {
    try {
      const resp = await invoke<{
        status: number;
        status_text: string;
        body: string;
        headers: Record<string, string>;
      }>('execute_native_http', {
        url,
        method,
        headers,
        body: body || null,
      });

      const ok = resp.status >= 200 && resp.status < 300;
      return {
        status: resp.status,
        statusText: resp.status_text,
        body: resp.body,
        headers: resp.headers,
        ok,
        text: async () => resp.body,
        json: async () => {
          try {
            return JSON.parse(resp.body);
          } catch {
            return {};
          }
        },
      };
    } catch (nativeErr) {
      console.warn('[HTTP] Native invoke error, attempting web fallback:', nativeErr);
    }
  }

  // 2. In browser / dev mode:
  // For Cloudflare Workers AI, rewrite api.cloudflare.com to /cf-ai-proxy to bypass CORS preflight failure
  let targetUrl = url;
  if (url.startsWith('https://api.cloudflare.com')) {
    targetUrl = url.replace('https://api.cloudflare.com', '/cf-ai-proxy');
  }

  const res = await fetch(targetUrl, {
    method,
    headers,
    body,
    signal: options.signal,
  });

  const bodyText = await res.text();
  const respHeaders: Record<string, string> = {};
  res.headers.forEach((val, key) => {
    respHeaders[key] = val;
  });

  return {
    status: res.status,
    statusText: res.statusText,
    body: bodyText,
    headers: respHeaders,
    ok: res.ok,
    text: async () => bodyText,
    json: async () => {
      try {
        return JSON.parse(bodyText);
      } catch {
        return {};
      }
    },
  };
}

/**
 * Universal Streaming Fetch Transport:
 * Handles URL rewriting (e.g. Cloudflare proxy) and returns the standard streaming Response object.
 */
export async function safeAiStreamFetch(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  } = {}
): Promise<Response> {
  const method = options.method || 'POST';
  const headers = options.headers || {};
  const body = options.body;

  let targetUrl = url;
  if (url.startsWith('https://api.cloudflare.com')) {
    targetUrl = url.replace('https://api.cloudflare.com', '/cf-ai-proxy');
  }

  try {
    const res = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: options.signal,
    });
    if (res.status === 404 && targetUrl !== url) {
      return fetch(url, { method, headers, body, signal: options.signal });
    }
    return res;
  } catch (err) {
    if (targetUrl !== url) {
      return fetch(url, { method, headers, body, signal: options.signal });
    }
    throw err;
  }
}
