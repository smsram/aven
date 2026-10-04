// Custom AI Provider Adapter for Aven
// Supports arbitrary request formatting, variable substitution, and JSONPath output mapping
import { BaseAdapter, AdapterCredential } from './BaseAdapter';
import { AIRequest, AIResponse, ProviderId, CustomProviderConfig } from '../types';
import { validateCredentialString, buildSafeHeaders } from '../headerUtils';

export const CUSTOM_PRESETS: Record<string, {
  name: string;
  authType: 'none' | 'api_key' | 'bearer' | 'custom';
  authHeaderName?: string;
  requestTemplate: string;
  responsePath: string;
  outputType: 'text' | 'json';
}> = {
  openai: {
    name: 'OpenAI-Compatible Endpoint',
    authType: 'bearer',
    requestTemplate: JSON.stringify({
      model: '{{model}}',
      messages: '{{messages}}',
      temperature: 0.7,
    }, null, 2),
    responsePath: '$.choices[0].message.content',
    outputType: 'text',
  },
  anthropic: {
    name: 'Anthropic-Compatible Endpoint',
    authType: 'custom',
    authHeaderName: 'x-api-key',
    requestTemplate: JSON.stringify({
      model: '{{model}}',
      max_tokens: 4096,
      messages: '{{messages}}',
    }, null, 2),
    responsePath: '$.content[0].text',
    outputType: 'text',
  },
  gemini: {
    name: 'Gemini REST Endpoint',
    authType: 'custom',
    authHeaderName: 'x-goog-api-key',
    requestTemplate: JSON.stringify({
      contents: [{ parts: [{ text: '{{prompt}}' }] }],
      generationConfig: { temperature: 0.7 },
    }, null, 2),
    responsePath: '$.candidates[0].content.parts[0].text',
    outputType: 'text',
  },
  generic_json: {
    name: 'Generic REST / JSON API',
    authType: 'bearer',
    requestTemplate: JSON.stringify({
      prompt: '{{prompt}}',
      model: '{{model}}',
    }, null, 2),
    responsePath: '$.output',
    outputType: 'text',
  },
};

export class CustomAdapter extends BaseAdapter {
  readonly providerId: ProviderId = 'custom';
  private config: CustomProviderConfig;
  private endpoint: string;

  constructor(endpoint: string, config: CustomProviderConfig) {
    super();
    this.endpoint = endpoint;
    this.config = config;
  }

  public updateConfig(endpoint: string, config: CustomProviderConfig) {
    this.endpoint = endpoint;
    this.config = config;
  }

  /**
   * Evaluates simple JSONPath such as:
   * $.choices[0].message.content
   * $.response.text
   * $.data[0].output
   */
  public static resolveJsonPath(data: any, path: string): any {
    if (!path || path === '$' || !data) return data;
    const cleanPath = path.startsWith('$.') ? path.slice(2) : path.startsWith('$') ? path.slice(1) : path;
    const segments = cleanPath.split('.').filter(Boolean);

    let current = data;
    for (const segment of segments) {
      if (current === undefined || current === null) return undefined;

      // Check for array indexing like choices[0]
      const arrayMatch = segment.match(/^([^\[]+)\[(\d+)\]$/);
      if (arrayMatch) {
        const prop = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);
        current = current[prop];
        if (Array.isArray(current)) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current[segment];
      }
    }
    return current;
  }

  private buildRequestBody(request: AIRequest, modelId: string): string {
    const template = this.config.requestJsonTemplate || '{"prompt":"{{prompt}}"}';

    const latestUserPrompt = request.messages.filter(m => m.role === 'user').pop()?.content || '';
    const systemPrompt = request.systemPrompt || '';

    // Variables map
    const replacements: Record<string, any> = {
      '{{prompt}}': latestUserPrompt,
      '{{user_input}}': latestUserPrompt,
      '{{system_prompt}}': systemPrompt,
      '{{model}}': modelId || this.config.model,
      '{{image}}': request.images?.[0] || '',
      '{{images}}': request.images || [],
      '{{audio}}': '',
      '{{video}}': '',
      '{{files}}': request.files || [],
      '{{messages}}': request.messages,
    };

    // Replace structured variables
    let rendered = template;

    // Handle stringified array/object injection safely
    for (const [key, val] of Object.entries(replacements)) {
      const quotedPlaceholder = `"${key}"`;
      if (rendered.includes(quotedPlaceholder)) {
        if (typeof val === 'string') {
          rendered = rendered.split(quotedPlaceholder).join(JSON.stringify(val));
        } else {
          rendered = rendered.split(quotedPlaceholder).join(JSON.stringify(val));
        }
      } else if (rendered.includes(key)) {
        if (typeof val === 'string') {
          rendered = rendered.split(key).join(val);
        } else {
          rendered = rendered.split(key).join(JSON.stringify(val));
        }
      }
    }

    return rendered;
  }

  private getAuthHeaders(credential: AdapterCredential): Record<string, string> {
    const rawHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
      ...(this.config.headers || {}),
    };

    if (credential.key) {
      const cleanKey = validateCredentialString(credential.key, 'Custom AI Credential');
      switch (this.config.authType) {
        case 'bearer':
          rawHeaders['Authorization'] = `Bearer ${cleanKey}`;
          break;
        case 'api_key':
          rawHeaders['x-api-key'] = cleanKey;
          break;
        case 'custom':
          if (this.config.authHeaderName) {
            const cleanHeaderName = this.config.authHeaderName.trim();
            rawHeaders[cleanHeaderName] = cleanKey;
          } else {
            rawHeaders['Authorization'] = cleanKey;
          }
          break;
        case 'none':
        default:
          break;
      }
    }

    return buildSafeHeaders(rawHeaders, 'Custom AI');
  }

  async sendRequest(
    request: AIRequest,
    credential: AdapterCredential,
    modelId: string
  ): Promise<AIResponse> {
    const bodyStr = this.buildRequestBody(request, modelId);
    const headers = this.getAuthHeaders(credential);

    try {
      const res = await fetch(this.endpoint, {
        method: this.config.httpMethod || 'POST',
        headers,
        body: this.config.httpMethod === 'GET' ? undefined : bodyStr,
        signal: request.abortSignal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        const err: any = new Error(`Custom AI error (${res.status}): ${errorText}`);
        err.status = res.status;
        throw err;
      }

      const contentType = res.headers.get('content-type') || '';
      let extractedText = '';

      if (contentType.includes('text/event-stream') && res.body) {
        // SSE streaming
        const { iterateSSE } = await import('../streamUtils');
        for await (const event of iterateSSE(res.body, request.abortSignal)) {
          if (event.data === '[DONE]') break;
          try {
            const data = JSON.parse(event.data);
            const delta = data.choices?.[0]?.delta?.content || data.response || data.text || '';
            if (delta) {
              extractedText += delta;
              request.onChunk?.(delta);
            }
          } catch {
            // Heartbeat
          }
        }
        return {
          text: extractedText,
          provider: 'custom',
          model: modelId || this.config.model,
        };
      }

      let rawData: any;
      if (contentType.includes('application/json')) {
        rawData = await res.json();
      } else {
        const text = await res.text();
        try {
          rawData = JSON.parse(text);
        } catch {
          rawData = text;
        }
      }

      // Extract output via JSONPath mapping
      if (typeof rawData === 'object' && this.config.responseJsonPath) {
        const resolved = CustomAdapter.resolveJsonPath(rawData, this.config.responseJsonPath);
        if (typeof resolved === 'string') {
          extractedText = resolved;
        } else if (resolved !== undefined) {
          extractedText = JSON.stringify(resolved, null, 2);
        } else {
          extractedText = JSON.stringify(rawData, null, 2);
        }
      } else if (typeof rawData === 'string') {
        extractedText = rawData;
      } else {
        extractedText = JSON.stringify(rawData);
      }

      if (request.onChunk && extractedText) {
        request.onChunk(extractedText);
      }

      return {
        text: extractedText,
        raw: rawData,
        provider: 'custom',
        model: modelId || this.config.model,
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
    if (!this.endpoint) {
      return { success: false, message: 'API Endpoint URL is required', errorType: 'BAD_REQUEST' };
    }

    try {
      const testReq: AIRequest = {
        messages: [{ role: 'user', content: 'Ping' }],
      };
      const bodyStr = this.buildRequestBody(testReq, modelId);
      const headers = this.getAuthHeaders(credential);

      const res = await fetch(this.endpoint, {
        method: this.config.httpMethod || 'POST',
        headers,
        body: this.config.httpMethod === 'GET' ? undefined : bodyStr,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        const normalized = this.normalizeError({ status: res.status, message: errText });
        return { success: false, message: normalized.message, errorType: normalized.type };
      }

      return { success: true, message: `Connected to Custom AI (${this.endpoint})` };
    } catch (e: any) {
      const normalized = this.normalizeError(e);
      return { success: false, message: normalized.message, errorType: normalized.type };
    }
  }
}
