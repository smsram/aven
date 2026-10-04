// Google Gemini Provider Adapter for Aven
import { BaseAdapter, AdapterCredential } from './BaseAdapter';
import { AIRequest, AIResponse, ProviderId } from '../types';
import { validateCredentialString, buildSafeHeaders } from '../headerUtils';

import { iterateSSE } from '../streamUtils';
import { safeAiStreamFetch } from '../httpTransport';

export class GeminiAdapter extends BaseAdapter {
  readonly providerId: ProviderId = 'gemini';

  async sendRequest(
    request: AIRequest,
    credential: AdapterCredential,
    modelId: string
  ): Promise<AIResponse> {
    const cleanKey = validateCredentialString(credential.key, 'Gemini API Key');
    const cleanModel = modelId || 'gemini-3.8-flash';
    const isStreaming = !!request.onChunk && request.stream !== false;
    const action = isStreaming ? 'streamGenerateContent?alt=sse&key=' : 'generateContent?key=';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:${action}${encodeURIComponent(cleanKey)}`;

    const contents = request.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Append images to latest user turn if provided
    if (request.images && request.images.length > 0 && contents.length > 0) {
      const last = contents[contents.length - 1];
      for (const img of request.images) {
        if (img.startsWith('data:')) {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            last.parts.push({
              // @ts-ignore
              inlineData: { mimeType: match[1], data: match[2] }
            });
          }
        }
      }
    }

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
      },
    };

    if (request.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = [
        {
          functionDeclarations: request.tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    try {
      const headers = buildSafeHeaders({ 'Content-Type': 'application/json' }, 'Gemini');
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
        const toolCalls: any[] = [];

        for await (const event of iterateSSE(res.body, request.abortSignal)) {
          try {
            const data = JSON.parse(event.data);
            const candidate = data.candidates?.[0];
            const parts = candidate?.content?.parts || [];

            for (const part of parts) {
              // 1. Gemini Thinking models (thought parts)
              if (part.thought) {
                const thoughtText = part.text || '';
                reasoning += thoughtText;
                request.onReasoningChunk?.(thoughtText);
              } else if (part.text) {
                text += part.text;
                request.onChunk?.(part.text);
              }

              // 2. Tool calls
              if (part.functionCall) {
                toolCalls.push({
                  id: `call_${Date.now()}_${toolCalls.length}`,
                  name: part.functionCall.name,
                  arguments: part.functionCall.args || {},
                });
              }
            }
          } catch {
            // Heartbeat or malformed SSE line
          }
        }

        return {
          text,
          reasoning: reasoning.trim() ? reasoning : undefined,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          provider: 'gemini',
          model: cleanModel,
        };
      }

      // Non-streaming fallback
      const data = await res.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      let text = '';
      let reasoning: string | undefined = undefined;

      for (const p of parts) {
        if (p.thought) {
          reasoning = (reasoning || '') + (p.text || '');
        } else if (p.text) {
          text += p.text;
        }
      }

      const toolCalls = parts
        .filter((p: any) => p.functionCall)
        .map((p: any, i: number) => ({
          id: `call_${i}_${Date.now()}`,
          name: p.functionCall.name,
          arguments: p.functionCall.args || {},
        }));

      return {
        text,
        reasoning: reasoning?.trim() ? reasoning : undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
          totalTokens: data.usageMetadata?.totalTokenCount,
        },
        finishReason: candidate?.finishReason === 'STOP' ? 'stop' : undefined,
        raw: data,
        provider: 'gemini',
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
      return { success: false, message: 'Gemini API key is required.', errorType: 'AUTH_FAILED' };
    }

    try {
      const cleanKey = validateCredentialString(credential.key, 'Gemini API Key');
      const cleanModel = modelId || 'gemini-3.8-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const headers = buildSafeHeaders({ 'Content-Type': 'application/json' }, 'Gemini');

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 2 },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error?.message || `HTTP ${res.status}`;
        const normalized = this.normalizeError({ status: res.status, message: msg });
        return { success: false, message: normalized.message, errorType: normalized.type };
      }

      return { success: true, message: `Connected to Gemini (${cleanModel})` };
    } catch (e: any) {
      const normalized = this.normalizeError(e);
      return { success: false, message: normalized.message, errorType: normalized.type };
    }
  }
}
