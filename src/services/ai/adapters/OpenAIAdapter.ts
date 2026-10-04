// OpenAI Provider Adapter for Aven
import { BaseAdapter, AdapterCredential } from './BaseAdapter';
import { AIRequest, AIResponse, ProviderId } from '../types';
import { validateCredentialString, buildSafeHeaders } from '../headerUtils';

import { iterateSSE } from '../streamUtils';
import { safeAiStreamFetch } from '../httpTransport';

export class OpenAIAdapter extends BaseAdapter {
  readonly providerId: ProviderId = 'openai';

  async sendRequest(
    request: AIRequest,
    credential: AdapterCredential,
    modelId: string
  ): Promise<AIResponse> {
    const cleanKey = validateCredentialString(credential.key, 'OpenAI API Key');
    const cleanModel = modelId || 'gpt-5.4';
    const url = 'https://api.openai.com/v1/chat/completions';
    const isStreaming = !!request.onChunk && request.stream !== false;

    const messages: any[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    for (const m of request.messages) {
      if (m.role === 'user' && request.images && request.images.length > 0) {
        const contentParts: any[] = [{ type: 'text', text: m.content }];
        for (const img of request.images) {
          contentParts.push({
            type: 'image_url',
            image_url: { url: img },
          });
        }
        messages.push({ role: 'user', content: contentParts });
      } else {
        messages.push({
          role: m.role,
          content: m.content,
          tool_call_id: m.toolCallId,
          tool_calls: m.toolCalls,
        });
      }
    }

    const body: Record<string, any> = {
      model: cleanModel,
      messages,
      temperature: request.temperature ?? 0.7,
      stream: isStreaming,
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    try {
      const headers = buildSafeHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      }, 'OpenAI');

      const res = await safeAiStreamFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: request.abortSignal,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        const msg = errorJson.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
      }

      if (isStreaming && res.body) {
        let text = '';
        let reasoning = '';
        const toolCallsMap: Record<number, { id: string; name: string; arguments: string }> = {};

        for await (const event of iterateSSE(res.body, request.abortSignal)) {
          if (event.data === '[DONE]') break;
          try {
            const data = JSON.parse(event.data);
            const choice = data.choices?.[0];
            const delta = choice?.delta;

            // 1. Reasoning content (o1/o3/reasoning models)
            if (delta?.reasoning_content) {
              reasoning += delta.reasoning_content;
              request.onReasoningChunk?.(delta.reasoning_content);
            } else if (delta?.reasoning) {
              reasoning += delta.reasoning;
              request.onReasoningChunk?.(delta.reasoning);
            }

            // 2. Normal text content
            if (delta?.content) {
              text += delta.content;
              request.onChunk?.(delta.content);
            }

            // 3. Tool calls streaming
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallsMap[idx]) {
                  toolCallsMap[idx] = { id: tc.id || `call_${idx}`, name: tc.function?.name || '', arguments: '' };
                }
                if (tc.function?.name) toolCallsMap[idx].name = tc.function.name;
                if (tc.function?.arguments) toolCallsMap[idx].arguments += tc.function.arguments;
              }
            }
          } catch {
            // Incomplete JSON or heartbeat chunk
          }
        }

        const toolCalls = Object.values(toolCallsMap).map(tc => {
          let parsedArgs = {};
          try { parsedArgs = JSON.parse(tc.arguments); } catch {}
          return { id: tc.id, name: tc.name, arguments: parsedArgs };
        });

        return {
          text,
          reasoning: reasoning.trim() ? reasoning : undefined,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          provider: 'openai',
          model: cleanModel,
        };
      }

      // Non-streaming fallback
      const data = await res.json();
      const choice = data.choices?.[0];
      const message = choice?.message;
      const text = message?.content || '';
      const reasoning = message?.reasoning_content || message?.reasoning || undefined;

      const toolCalls = message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function?.name,
        arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
      }));

      return {
        text,
        reasoning,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
        finishReason: choice?.finish_reason,
        raw: data,
        provider: 'openai',
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
    if (!credential.key) {
      return { success: false, message: 'OpenAI API key is required.', errorType: 'AUTH_FAILED' };
    }

    try {
      const cleanKey = validateCredentialString(credential.key, 'OpenAI API Key');
      const cleanModel = modelId || 'gpt-5.4-mini';
      const url = 'https://api.openai.com/v1/chat/completions';
      const headers = buildSafeHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      }, 'OpenAI');

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: cleanModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 2,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error?.message || `HTTP ${res.status}`;
        const normalized = this.normalizeError({ status: res.status, message: msg });
        return { success: false, message: normalized.message, errorType: normalized.type };
      }

      return { success: true, message: `Connected to OpenAI (${cleanModel})` };
    } catch (e: any) {
      const normalized = this.normalizeError(e);
      return { success: false, message: normalized.message, errorType: normalized.type };
    }
  }
}
