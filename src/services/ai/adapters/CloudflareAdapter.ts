// Cloudflare Workers AI Provider Adapter for Aven
import { BaseAdapter, AdapterCredential } from './BaseAdapter';
import { AIRequest, AIResponse, ProviderId } from '../types';
import { validateCredentialString, buildSafeHeaders } from '../headerUtils';
import { safeAiFetch, safeAiStreamFetch } from '../httpTransport';
import { iterateSSE, ThinkTagStreamFilter } from '../streamUtils';

export class CloudflareAdapter extends BaseAdapter {
  readonly providerId: ProviderId = 'cloudflare';

  async sendRequest(
    request: AIRequest,
    credential: AdapterCredential,
    modelId: string
  ): Promise<AIResponse> {
    const cleanToken = validateCredentialString(credential.key, 'Cloudflare API Token');
    const cleanAccount = validateCredentialString(credential.accountId, 'Cloudflare Account ID');
    const cleanModel = modelId || '@cf/google/gemma-4-26b-a4b-it';
    const url = `https://api.cloudflare.com/client/v4/accounts/${cleanAccount}/ai/run/${cleanModel}`;
    const isStreaming = !!request.onChunk && request.stream !== false;

    const messages: any[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    for (const m of request.messages) {
      messages.push({
        role: m.role,
        content: m.content,
      });
    }

    const body: Record<string, any> = {
      messages,
      max_tokens: 4096,
      stream: isStreaming,
    };

    // Enable thinking / reasoning parameters if requested or supported
    if (request.reasoning) {
      body.reasoning = true;
    }

    if (request.images && request.images.length > 0) {
      // Cloudflare multimodal models accept image bytes or base64
      body.image = request.images[0];
    }

    try {
      const headers = buildSafeHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanToken}`,
      }, 'Cloudflare');

      const res = await safeAiStreamFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: request.abortSignal,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        const msg = errorJson.errors?.[0]?.message || `HTTP ${res.status}: ${res.statusText}`;
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
      }

      const contentType = res.headers.get('content-type') || '';
      const isSSE = contentType.includes('text/event-stream') || (!contentType.includes('application/json') && isStreaming);

      if (isStreaming && res.body && isSSE) {
        let fullText = '';
        let fullReasoning = '';

        const thinkFilter = new ThinkTagStreamFilter({
          onChunk: (chunk) => {
            fullText += chunk;
            request.onChunk?.(chunk);
          },
          onReasoningChunk: (chunk) => {
            fullReasoning += chunk;
            request.onReasoningChunk?.(chunk);
          },
        });

        for await (const event of iterateSSE(res.body, request.abortSignal)) {
          if (event.data === '[DONE]') break;
          try {
            const data = JSON.parse(event.data);

            // 1. Root level reasoning / thinking fields (e.g. Cloudflare reasoning models)
            const rootReasoning = data.reasoning || data.thinking || data.reasoning_content;
            if (rootReasoning) {
              fullReasoning += rootReasoning;
              request.onReasoningChunk?.(rootReasoning);
            }

            // 2. OpenAI / Chat-completions style choices delta
            const choice = data.choices?.[0];
            if (choice) {
              const delta = choice.delta;
              const deltaReasoning = delta?.reasoning || delta?.thinking || delta?.reasoning_content || choice.reasoning;
              if (deltaReasoning) {
                fullReasoning += deltaReasoning;
                request.onReasoningChunk?.(deltaReasoning);
              }
              if (delta?.content) {
                thinkFilter.feed(delta.content);
              }
            }

            // 3. Cloudflare standard response field
            if (data.response) {
              thinkFilter.feed(data.response);
            }
          } catch {
            // Heartbeat or malformed SSE line
          }
        }

        thinkFilter.flush();

        return {
          text: fullText,
          reasoning: fullReasoning.trim() ? fullReasoning : undefined,
          provider: 'cloudflare',
          model: cleanModel,
        };
      }

      // Non-streaming fallback
      const data = await res.json();
      let text = '';
      let reasoning: string | undefined = undefined;

      const choice = data.result?.choices?.[0];
      if (choice?.message) {
        text = choice.message.content || '';
        reasoning = choice.message.reasoning || choice.message.thinking || undefined;
      } else if (data.result?.response) {
        text = data.result.response;
        reasoning = data.result.reasoning || data.result.thinking || undefined;
      } else if (typeof data.result === 'string') {
        text = data.result;
      }

      // If text contains embedded <think>...</think> tags (e.g. DeepSeek R1), separate reasoning
      if (text && text.includes('<think>')) {
        const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
          if (!reasoning) {
            reasoning = thinkMatch[1].trim();
          }
          text = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
        }
      }

      if (isStreaming) {
        if (reasoning) {
          request.onReasoningChunk?.(reasoning);
        }
        if (text) {
          request.onChunk?.(text);
        }
      }

      return {
        text,
        reasoning,
        usage: data.result?.usage ? {
          promptTokens: data.result.usage.prompt_tokens,
          completionTokens: data.result.usage.completion_tokens,
          totalTokens: data.result.usage.total_tokens,
        } : undefined,
        raw: data,
        provider: 'cloudflare',
        model: cleanModel,
      };
    } catch (e) {
      const normalized = this.normalizeError(e);
      const err: any = new Error(normalized.message);
      err.type = normalized.type;
      throw err;
    }
  }

  async testConnection(
    credential: AdapterCredential,
    modelId: string
  ): Promise<{ success: boolean; message: string; errorType?: any }> {
    if (!credential.accountId) {
      return { success: false, message: 'Cloudflare Account ID is missing.', errorType: 'AUTH_FAILED' };
    }
    if (!credential.key) {
      return { success: false, message: 'Cloudflare API Token is missing.', errorType: 'AUTH_FAILED' };
    }

    try {
      const cleanToken = validateCredentialString(credential.key, 'Cloudflare API Token');
      const cleanAccount = validateCredentialString(credential.accountId, 'Cloudflare Account ID');
      const cleanModel = modelId || '@cf/google/gemma-4-26b-a4b-it';
      const url = `https://api.cloudflare.com/client/v4/accounts/${cleanAccount}/ai/run/${cleanModel}`;
      const headers = buildSafeHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanToken}`,
      }, 'Cloudflare');

      const res = await safeAiFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 64,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.errors?.[0]?.message || `HTTP ${res.status}`;
        const normalized = this.normalizeError({ status: res.status, message: msg });
        return { success: false, message: normalized.message, errorType: normalized.type };
      }

      return { success: true, message: `Connected to Cloudflare Workers AI (${cleanModel})` };
    } catch (e: any) {
      const normalized = this.normalizeError(e);
      return { success: false, message: normalized.message, errorType: normalized.type };
    }
  }
}
