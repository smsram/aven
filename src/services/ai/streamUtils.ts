// Universal Streaming Utilities for AI Providers in Aven
// Handles SSE (Server-Sent Events), NDJSON streams, chunk buffering, and real-time reasoning/thinking extraction

export interface SSEEvent {
  event?: string;
  data: string;
  id?: string;
}

/**
 * Reads a ReadableStream<Uint8Array> from fetch and yields parsed Server-Sent Events.
 * Handles split lines, multi-line data fields, and stream completion.
 */
export async function* iterateSSE(
  stream: ReadableStream<Uint8Array>,
  abortSignal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      if (abortSignal?.aborted) {
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      // Keep whatever is after the last newline in the buffer
      buffer = lines.pop() || '';

      let currentEvent: SSEEvent = { data: '' };

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          // Empty line indicates dispatch of event
          if (currentEvent.data || currentEvent.event) {
            yield currentEvent;
            currentEvent = { data: '' };
          }
          continue;
        }

        if (trimmed.startsWith(':')) {
          // SSE comment, ignore
          continue;
        }

        if (trimmed.startsWith('event:')) {
          currentEvent.event = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.slice(5).trim();
          currentEvent.data = currentEvent.data ? `${currentEvent.data}\n${dataStr}` : dataStr;
        } else if (trimmed.startsWith('id:')) {
          currentEvent.id = trimmed.slice(3).trim();
        }
      }
    }

    // Flush any leftover in buffer
    if (buffer.trim()) {
      if (buffer.startsWith('data:')) {
        yield { data: buffer.slice(5).trim() };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Reads a ReadableStream<Uint8Array> and yields parsed NDJSON (Newline Delimited JSON) objects.
 */
export async function* iterateNDJSON<T = any>(
  stream: ReadableStream<Uint8Array>,
  abortSignal?: AbortSignal
): AsyncGenerator<T, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      if (abortSignal?.aborted) {
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          yield parsed;
        } catch {
          // Incomplete or non-JSON line, continue buffering
        }
      }
    }

    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        yield parsed;
      } catch {
        // Ignore unparseable tail
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Real-time filter for streaming text that may contain embedded <think>...</think> tags
 * (such as DeepSeek R1 or Qwen reasoning models).
 * Routes thinking chunks to onReasoningChunk and final answer chunks to onChunk.
 */
export class ThinkTagStreamFilter {
  private inThink: boolean = false;
  private buffer: string = '';
  private onChunk?: (chunk: string) => void;
  private onReasoningChunk?: (chunk: string) => void;

  constructor(callbacks: {
    onChunk?: (chunk: string) => void;
    onReasoningChunk?: (chunk: string) => void;
  }) {
    this.onChunk = callbacks.onChunk;
    this.onReasoningChunk = callbacks.onReasoningChunk;
  }

  public feed(chunk: string) {
    if (!chunk) return;
    this.buffer += chunk;

    while (this.buffer.length > 0) {
      if (!this.inThink) {
        const openIdx = this.buffer.indexOf('<think>');
        if (openIdx === -1) {
          // Check if buffer might end with a partial "<think>"
          const partialMatch = this.buffer.match(/<t?(h?(i?(n?k?)?)?)?$/);
          if (partialMatch && partialMatch[0].length > 0 && partialMatch[0] !== '<') {
            const safeLen = this.buffer.length - partialMatch[0].length;
            if (safeLen > 0) {
              const safeText = this.buffer.slice(0, safeLen);
              this.onChunk?.(safeText);
              this.buffer = this.buffer.slice(safeLen);
            }
            break;
          } else {
            this.onChunk?.(this.buffer);
            this.buffer = '';
            break;
          }
        } else {
          // Content before <think>
          if (openIdx > 0) {
            this.onChunk?.(this.buffer.slice(0, openIdx));
          }
          this.inThink = true;
          this.buffer = this.buffer.slice(openIdx + 7); // skip <think>
        }
      } else {
        // Currently inside <think>
        const closeIdx = this.buffer.indexOf('</think>');
        if (closeIdx === -1) {
          // Check for partial "</think>"
          const partialMatch = this.buffer.match(/<\/?t?(h?(i?(n?k?)?)?)?$/);
          if (partialMatch && partialMatch[0].length > 0) {
            const safeLen = this.buffer.length - partialMatch[0].length;
            if (safeLen > 0) {
              const safeText = this.buffer.slice(0, safeLen);
              this.onReasoningChunk?.(safeText);
              this.buffer = this.buffer.slice(safeLen);
            }
            break;
          } else {
            this.onReasoningChunk?.(this.buffer);
            this.buffer = '';
            break;
          }
        } else {
          // Reasoning before </think>
          if (closeIdx > 0) {
            this.onReasoningChunk?.(this.buffer.slice(0, closeIdx));
          }
          this.inThink = false;
          this.buffer = this.buffer.slice(closeIdx + 8); // skip </think>
        }
      }
    }
  }

  public flush() {
    if (this.buffer) {
      if (this.inThink) {
        this.onReasoningChunk?.(this.buffer);
      } else {
        this.onChunk?.(this.buffer);
      }
      this.buffer = '';
    }
  }
}
