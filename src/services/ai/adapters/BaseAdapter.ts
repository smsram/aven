// Base Provider Adapter for Aven Desktop AI Application
import {
  AIRequest,
  AIResponse,
  NormalizedErrorType,
  ProviderId
} from '../types';

export interface AdapterCredential {
  key: string;
  accountId?: string;
}

export abstract class BaseAdapter {
  abstract readonly providerId: ProviderId;

  abstract sendRequest(
    request: AIRequest,
    credential: AdapterCredential,
    modelId: string
  ): Promise<AIResponse>;

  abstract testConnection(
    credential: AdapterCredential,
    modelId: string
  ): Promise<{ success: boolean; message: string; errorType?: NormalizedErrorType }>;

  public normalizeError(err: any): { type: NormalizedErrorType; message: string } {
    if (!err) {
      return { type: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
    }

    const message = err.message || (typeof err === 'string' ? err : 'Error occurred during request');
    const status = err.status || err.statusCode || (err.response && err.response.status);

    if (status === 429 || /rate limit|quota|exceeded|too many requests/i.test(message)) {
      return { type: 'RATE_LIMITED', message: 'Rate limit or quota threshold reached' };
    }
    if (status === 401 || status === 403 || /unauthorized|forbidden|invalid api key|auth failed|authentication/i.test(message)) {
      return { type: 'AUTH_FAILED', message: 'Invalid or unauthorized credentials' };
    }
    if (status === 404 || /model not found|unsupported model|does not exist/i.test(message)) {
      return { type: 'MODEL_UNAVAILABLE', message: 'Selected model is not available' };
    }
    if (status === 400 || /bad request|invalid parameter|invalid argument/i.test(message)) {
      return { type: 'BAD_REQUEST', message: `Bad request: ${message}` };
    }
    if (status >= 500 || /server error|internal error|gateway/i.test(message)) {
      return { type: 'SERVER_ERROR', message: 'Provider server encountered an error' };
    }
    if (/network|failed to fetch|fetch failed|connection refused|econnrefused|timeout|abort/i.test(message)) {
      return { type: 'NETWORK_ERROR', message: 'Network connection failure or timeout' };
    }

    return { type: 'UNKNOWN_ERROR', message };
  }
}
