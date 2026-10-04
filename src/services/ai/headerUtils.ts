// HTTP Header Validation and Construction Utilities for Aven
// Ensures 100% compliance with WHATWG Fetch API and ISO-8859-1 ByteString requirements.

/**
 * Validates that an API key, token, or credential string does not contain
 * non-ISO-8859-1 characters (code points > 255) or masked placeholder bullets ("•").
 *
 * Requirements:
 * - Do NOT silently modify or corrupt credentials.
 * - Throw a clear, actionable configuration error if invalid characters are detected.
 */
export function validateCredentialString(value: string | undefined | null, credentialLabel: string = 'API Key'): string {
  if (!value) {
    const err: any = new Error(`${credentialLabel} is empty. Please configure a valid credential in Connections.`);
    err.type = 'AUTH_FAILED';
    throw err;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    const err: any = new Error(`${credentialLabel} is empty. Please configure a valid credential in Connections.`);
    err.type = 'AUTH_FAILED';
    throw err;
  }

  // Check if string contains mask bullets (• = Unicode \u2022, code point 8226)
  if (trimmed.includes('•') || trimmed.includes('\u2022')) {
    const err: any = new Error(
      `${credentialLabel} contains masked placeholder characters ("•"). Please re-enter your full API key or token in Connections.`
    );
    err.type = 'AUTH_FAILED';
    throw err;
  }

  // Check for any non-ISO-8859-1 code points (> 255)
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code > 255) {
      const char = trimmed[i];
      const err: any = new Error(
        `${credentialLabel} contains invalid character '${char}' (code point ${code}) which cannot be passed in HTTP headers. Please check and re-enter your credential in Connections.`
      );
      err.type = 'AUTH_FAILED';
      throw err;
    }
  }

  return trimmed;
}

/**
 * Builds a clean, validated Record<string, string> of HTTP headers for the Fetch API.
 *
 * Guarantees:
 * 1. Every header name is a valid non-empty ASCII token string.
 * 2. Every header value is a valid non-empty ISO-8859-1 string.
 * 3. Never passes objects, arrays, undefined, null, or JSON objects as header values.
 * 4. Only includes headers that actually have a non-empty value.
 * 5. Validates against the Fetch API Headers specification before returning.
 */
export function buildSafeHeaders(
  rawHeaders: Record<string, any>,
  contextName: string = 'Request'
): Record<string, string> {
  const result: Record<string, string> = {};

  if (!rawHeaders || typeof rawHeaders !== 'object') {
    return result;
  }

  for (const [key, rawVal] of Object.entries(rawHeaders)) {
    // 1. Header Name Validation
    if (!key || typeof key !== 'string') continue;
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;

    // Must be valid ASCII token without whitespace or control characters
    for (let i = 0; i < trimmedKey.length; i++) {
      const code = trimmedKey.charCodeAt(i);
      if (code > 127 || code <= 32 || code === 127) {
        throw new Error(
          `Invalid HTTP header name "${trimmedKey}" in ${contextName}. Header names must only contain valid ASCII characters without spaces.`
        );
      }
    }

    // 2. Reject undefined, null, functions
    if (rawVal === undefined || rawVal === null) continue;

    // 3. Reject objects, arrays (do NOT pass JSON objects as header values!)
    if (typeof rawVal === 'object') {
      throw new Error(
        `Invalid HTTP header value for "${trimmedKey}" in ${contextName}: objects and arrays cannot be passed as HTTP header values.`
      );
    }

    // 4. Convert to string and trim
    const strVal = String(rawVal).trim();
    if (!strVal) continue; // Only include headers that actually have a value

    // 5. Validate ISO-8859-1 characters (code point <= 255)
    for (let i = 0; i < strVal.length; i++) {
      const code = strVal.charCodeAt(i);
      if (code > 255) {
        if (strVal.includes('•') || strVal.includes('\u2022')) {
          const err: any = new Error(
            `Header "${trimmedKey}" in ${contextName} contains masked placeholder characters ("•"). Please re-enter your credential in Connections.`
          );
          err.type = 'AUTH_FAILED';
          throw err;
        }
        const err: any = new Error(
          `Header "${trimmedKey}" in ${contextName} contains non ISO-8859-1 character '${strVal[i]}' (code point ${code}). Header values must contain only valid ISO-8859-1 characters.`
        );
        err.type = 'AUTH_FAILED';
        throw err;
      }
    }

    result[trimmedKey] = strVal;
  }

  // Pre-validate with Headers constructor if available in environment
  if (typeof Headers !== 'undefined') {
    try {
      new Headers(result);
    } catch (e: any) {
      throw new Error(`Failed to construct valid HTTP headers for ${contextName}: ${e.message}`);
    }
  }

  return result;
}
