// Ollama Local AI Provider Adapter for Aven
import { BaseAdapter, AdapterCredential } from './BaseAdapter';
import { AIRequest, AIResponse, ProviderId } from '../types';
import { buildSafeHeaders } from '../headerUtils';

import { iterateNDJSON, ThinkTagStreamFilter } from '../streamUtils';

export class OllamaAdapter extends BaseAdapter {
  readonly providerId: ProviderId = 'ollama';
  private endpoint: string;

  constructor(endpoint: string = 'http://localhost:11434') {
    super();
    this.endpoint = endpoint.replace(/\/+$/, '');
  }

  setEndpoint(endpoint: string) {
    this.endpoint = endpoint.replace(/\/+$/, '');
  }

  async sendRequest(
    request: AIRequest,
    _credential: AdapterCredential,
    modelId: string
  ): Promise<AIResponse> {
    const url = `${this.endpoint}/api/chat`;
    const isStreaming = !!request.onChunk && request.stream !== false;

    const messages = request.messages.map(m => {
      const msgObj: any = {
        role: m.role,
        content: m.content,
      };
      if (m.role === 'user' && request.images && request.images.length > 0) {
        msgObj.images = request.images.map(img => {
          if (img.startsWith('data:')) {
            return img.split(',')[1];
          }
          return img;
        });
      }
      return msgObj;
    });

    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    try {
      const headers = buildSafeHeaders({ 'Content-Type': 'application/json' }, 'Ollama');
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: isStreaming,
          options: {
            temperature: request.temperature ?? 0.7,
          },
        }),
        signal: request.abortSignal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        const err: any = new Error(`Ollama error (${res.status}): ${errorText}`);
        err.status = res.status;
        throw err;
      }

      if (isStreaming && res.body) {
        let text = '';
        let reasoning = '';

        const thinkFilter = new ThinkTagStreamFilter({
          onChunk: (chunk) => {
            text += chunk;
            request.onChunk?.(chunk);
          },
          onReasoningChunk: (chunk) => {
            reasoning += chunk;
            request.onReasoningChunk?.(chunk);
          },
        });

        for await (const chunk of iterateNDJSON(res.body, request.abortSignal)) {
          // Native thinking field from Ollama
          if (chunk.message?.thinking) {
            reasoning += chunk.message.thinking;
            request.onReasoningChunk?.(chunk.message.thinking);
          }
          // Content field (may contain <think> tags)
          if (chunk.message?.content) {
            thinkFilter.feed(chunk.message.content);
          }
        }

        thinkFilter.flush();

        return {
          text,
          reasoning: reasoning.trim() ? reasoning : undefined,
          provider: 'ollama',
          model: modelId,
        };
      }

      const data = await res.json();
      let text = data.message?.content || '';
      let reasoning = data.message?.thinking || undefined;

      if (text.includes('<think>')) {
        const match = text.match(/<think>([\s\S]*?)<\/think>/);
        if (match) {
          if (!reasoning) reasoning = match[1].trim();
          text = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
        }
      }

      return {
        text,
        reasoning,
        usage: {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done ? 'stop' : undefined,
        raw: data,
        provider: 'ollama',
        model: modelId,
      };
    } catch (e) {
      const normalized = this.normalizeError(e);
      const err: any = new Error(normalized.message);
      err.type = normalized.type;
      throw err;
    }
  }

  async testConnection(
    _credential: AdapterCredential,
    modelId: string
  ): Promise<{ success: boolean; message: string; errorType?: any }> {
    try {
      const headers = buildSafeHeaders({ 'Content-Type': 'application/json' }, 'Ollama');
      const res = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        return {
          success: false,
          message: `Ollama returned HTTP ${res.status}. Is Ollama running?`,
          errorType: 'SERVER_ERROR',
        };
      }

      const data = await res.json();
      const models = data.models || [];
      const hasModel = models.some((m: any) => m.name === modelId || m.model === modelId);

      if (models.length === 0) {
        return {
          success: true,
          message: 'Ollama is running, but no local models are currently installed. Run `ollama run gemma` to pull one.',
        };
      }

      if (modelId && !hasModel) {
        return {
          success: true,
          message: `Ollama is running with ${models.length} model(s). Model "${modelId}" is not downloaded yet.`,
        };
      }

      return {
        success: true,
        message: `Connected to local Ollama (${models.length} models available)`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'Could not connect to Ollama. Make sure Ollama is installed and running on your PC (http://localhost:11434).',
        errorType: 'NETWORK_ERROR',
      };
    }
  }
}
