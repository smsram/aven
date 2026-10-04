// Anthropic Claude Provider Adapter for Aven
import { BaseAdapter, AdapterCredential } from './BaseAdapter';
import { AIRequest, AIResponse, ProviderId } from '../types';
import { validateCredentialString, buildSafeHeaders } from '../headerUtils';

import { iterateSSE } from '../streamUtils';
import { safeAiStreamFetch } from '../httpTransport';

export class AnthropicAdapter extends BaseAdapter {
  readonly providerId: ProviderId = 'anthropic';

  async sendRequest(
    request: AIRequest,
    credential: AdapterCredential,
    modelId: string
  ): Promise<AIResponse> {
    const cleanKey = validateCredentialString(credential.key, 'Anthropic API Key');
    const cleanModel = modelId || 'claude-sonnet-5.5';
    const url = 'https://api.anthropic.com/v1/messages';
    const isStreaming = !!request.onChunk && request.stream !== false;

    const messages: any[] = [];
    for (const m of request.messages) {
      if (m.role === 'system') continue; // Handled in top-level system parameter

      if (m.role === 'user' && request.images && request.images.length > 0) {
        const contentBlocks: any[] = [{ type: 'text', text: m.content }];
        for (const img of request.images) {
          if (img.startsWith('data:')) {
            const match = img.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              contentBlocks.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: match[1],
                  data: match[2],
                },
              });
            }
          }
        }
        messages.push({ role: 'user', content: contentBlocks });
      } else {
        messages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        });
      }
    }

    const body: Record<string, any> = {
      model: cleanModel,
      max_tokens: 4096,
      messages,
      temperature: request.temperature ?? 0.7,
      stream: isStreaming,
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    try {
      const headers = buildSafeHeaders({
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
      }, 'Anthropic');

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
          try {
            const data = JSON.parse(event.data);
            const delta = data.delta;

            // 1. Text delta
            if (delta?.type === 'text_delta' && delta.text) {
              text += delta.text;
              request.onChunk?.(delta.text);
            }

            // 2. Thinking delta (Anthropic Extended Thinking)
            if (delta?.type === 'thinking_delta' && delta.thinking) {
              reasoning += delta.thinking;
              request.onReasoningChunk?.(delta.thinking);
            }

            // 3. Tool use start & delta
            if (data.type === 'content_block_start' && data.content_block?.type === 'tool_use') {
              const idx = data.index ?? 0;
              toolCallsMap[idx] = {
                id: data.content_block.id || `call_${idx}`,
                name: data.content_block.name || '',
                arguments: '',
              };
            }
            if (delta?.type === 'input_json_delta' && delta.partial_json) {
              const idx = data.index ?? 0;
              if (toolCallsMap[idx]) {
                toolCallsMap[idx].arguments += delta.partial_json;
              }
            }
          } catch {
            // Heartbeat or metadata event
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
          provider: 'anthropic',
          model: cleanModel,
        };
      }

      // Non-streaming fallback
      const data = await res.json();
      let text = '';
      let reasoning: string | undefined = undefined;
      const toolCalls: any[] = [];

      for (const block of data.content || []) {
        if (block.type === 'text') {
          text += block.text;
        } else if (block.type === 'thinking') {
          reasoning = (reasoning || '') + block.thinking;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input || {},
          });
        }
      }

      return {
        text,
        reasoning: reasoning?.trim() ? reasoning : undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: data.usage?.input_tokens,
          completionTokens: data.usage?.output_tokens,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason,
        raw: data,
        provider: 'anthropic',
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
      return { success: false, message: 'Anthropic API key is required.', errorType: 'AUTH_FAILED' };
    }

    try {
      const cleanKey = validateCredentialString(credential.key, 'Anthropic API Key');
      const cleanModel = modelId || 'claude-haiku-4.5';
      const url = 'https://api.anthropic.com/v1/messages';
      const headers = buildSafeHeaders({
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
      }, 'Anthropic');

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: cleanModel,
          max_tokens: 2,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error?.message || `HTTP ${res.status}`;
        const normalized = this.normalizeError({ status: res.status, message: msg });
        return { success: false, message: normalized.message, errorType: normalized.type };
      }

      return { success: true, message: `Connected to Anthropic (${cleanModel})` };
    } catch (e: any) {
      const normalized = this.normalizeError(e);
      return { success: false, message: normalized.message, errorType: normalized.type };
    }
  }
}
