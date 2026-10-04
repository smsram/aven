// Credential Manager for Aven Desktop AI Application
// Handles secure storage, masking, health tracking, cooldown, and rotation
import { ProviderCredential, CredentialHealth, NormalizedErrorType } from './types';

const VAULT_STORAGE_KEY = 'aven_secrets_vault_v1';
const HEALTH_STORAGE_KEY = 'aven_credential_health_v1';

export const maskApiKey = (key: string): string => {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
};

export const maskAccountId = (id: string): string => {
  if (!id) return '';
  const trimmed = id.trim();
  if (trimmed.length <= 6) {
    return '••••••';
  }
  const prefix = trimmed.slice(0, 3);
  const suffix = trimmed.slice(-3);
  return `${prefix}••••${suffix}`;
};

export const parseTokens = (input: string | string[]): string[] => {
  if (Array.isArray(input)) {
    return input.map(k => k.trim()).filter(Boolean);
  }
  if (!input) return [];
  return input
    .split(/[,\n]/)
    .map(k => k.trim())
    .filter(Boolean);
};

export interface CloudflarePairingResult {
  valid: boolean;
  credentials: Array<{ accountId: string; apiToken: string }>;
  error?: string;
}

export const pairCloudflareCredentials = (
  accountInput: string,
  tokenInput: string
): CloudflarePairingResult => {
  const accountIds = parseTokens(accountInput);
  const tokens = parseTokens(tokenInput);

  if (accountIds.length === 0 || tokens.length === 0) {
    return {
      valid: false,
      credentials: [],
      error: 'Both Account ID and API Token are required.',
    };
  }

  // Case 1: Single account ID, multiple or single tokens -> reuse account ID
  if (accountIds.length === 1) {
    return {
      valid: true,
      credentials: tokens.map(tok => ({
        accountId: accountIds[0],
        apiToken: tok,
      })),
    };
  }

  // Case 2: Matching count of accounts and tokens
  if (accountIds.length === tokens.length) {
    return {
      valid: true,
      credentials: accountIds.map((acc, i) => ({
        accountId: acc,
        apiToken: tokens[i],
      })),
    };
  }

  // Mismatched
  return {
    valid: false,
    credentials: [],
    error: `Mismatched credentials: provided ${accountIds.length} Account IDs and ${tokens.length} API Tokens. Please provide either 1 Account ID for all tokens or an equal count of each.`,
  };
};

class CredentialManager {
  // In-memory secrets vault (populated from storage)
  private vault: Record<string, Record<string, string>> = {}; // providerId -> { credentialId: secretKey }
  private cloudflareAccounts: Record<string, Record<string, string>> = {}; // providerId -> { credentialId: accountId }
  private healthState: Record<string, Record<string, ProviderCredential>> = {}; // providerId -> { credentialId: ProviderCredential }

  constructor() {
    this.loadVault();
  }

  private loadVault() {
    try {
      const storedVault = localStorage.getItem(VAULT_STORAGE_KEY);
      if (storedVault) {
        const parsed = JSON.parse(storedVault);
        this.vault = parsed.vault || {};
        this.cloudflareAccounts = parsed.cloudflareAccounts || {};

        // Sanitize any corrupted masked keys from earlier storage sessions
        for (const provId of Object.keys(this.vault)) {
          for (const credId of Object.keys(this.vault[provId])) {
            const raw = this.vault[provId][credId];
            if (raw && (raw.includes('•') || raw.includes('\u2022'))) {
              delete this.vault[provId][credId];
            }
          }
        }
        for (const provId of Object.keys(this.cloudflareAccounts)) {
          for (const credId of Object.keys(this.cloudflareAccounts[provId])) {
            const rawAcc = this.cloudflareAccounts[provId][credId];
            if (rawAcc && (rawAcc.includes('•') || rawAcc.includes('\u2022'))) {
              delete this.cloudflareAccounts[provId][credId];
            }
          }
        }
      }
      const storedHealth = localStorage.getItem(HEALTH_STORAGE_KEY);
      if (storedHealth) {
        this.healthState = JSON.parse(storedHealth);
      }

      // Check if Cloudflare or other providers are missing secrets in vault and recover from settings backup
      this.recoverFromSettingsBackup();

      // Clean up orphaned healthState entries that have no raw secrets in the vault
      for (const provId of Object.keys(this.healthState)) {
        for (const credId of Object.keys(this.healthState[provId])) {
          const raw = this.vault[provId]?.[credId];
          if (!raw || raw.includes('•') || raw.includes('\u2022')) {
            delete this.healthState[provId][credId];
          }
          if (provId === 'provider-cloudflare') {
            const rawAcc = this.cloudflareAccounts[provId]?.[credId];
            if (!rawAcc || rawAcc.includes('•') || rawAcc.includes('\u2022')) {
              delete this.healthState[provId][credId];
              delete this.vault[provId]?.[credId];
            }
          }
        }
      }

      this.persistVault();
    } catch {
      this.vault = {};
      this.cloudflareAccounts = {};
      this.healthState = {};
    }
  }

  /**
   * Recovers credentials from aven_desktop_settings_v1 or aven_settings_v1 if the vault has no valid raw credentials.
   * Ensures user credentials configured during onboarding or settings are never lost.
   */
  public recoverFromSettingsBackup() {
    try {
      const settingsStr =
        localStorage.getItem('aven_desktop_settings_v1') ||
        localStorage.getItem('aven_settings_v1');
      if (!settingsStr) return;
      const settings = JSON.parse(settingsStr);

      // 1. Recover Cloudflare Workers AI
      const cfProvId = 'provider-cloudflare';
      const hasValidCf = this.hasValidCredentials(cfProvId);

      let cfAcc = settings.cloudflareAccountId;
      let cfTok = settings.cloudflareApiToken;

      // Also check customProviders if top-level is not set or empty
      if ((!cfAcc || !cfTok) && Array.isArray(settings.customProviders)) {
        const cfCust = settings.customProviders.find(
          (p: any) => p.providerType === 'cloudflare' || p.id === 'provider-cloudflare'
        );
        if (cfCust) {
          cfAcc = cfAcc || cfCust.cloudflareAccountId;
          cfTok = cfTok || cfCust.cloudflareApiToken || (cfCust.apiKeys && cfCust.apiKeys[0]);
        }
      }

      if (!hasValidCf && cfAcc && cfTok) {
        const cleanAcc = cfAcc.trim();
        const cleanTok = cfTok.trim();
        const isSampleTok = cleanTok.toLowerCase().includes('sample-cloudflare');
        if (
          cleanAcc &&
          cleanTok &&
          !isSampleTok &&
          !cleanTok.includes('•') &&
          !cleanTok.includes('\u2022') &&
          !cleanAcc.includes('•') &&
          !cleanAcc.includes('\u2022')
        ) {
          const credId = `cred-${cfProvId}-default`;
          if (!this.vault[cfProvId]) this.vault[cfProvId] = {};
          if (!this.cloudflareAccounts[cfProvId]) this.cloudflareAccounts[cfProvId] = {};
          if (!this.healthState[cfProvId]) this.healthState[cfProvId] = {};

          this.vault[cfProvId][credId] = cleanTok;
          this.cloudflareAccounts[cfProvId][credId] = cleanAcc;
          this.healthState[cfProvId][credId] = {
            id: credId,
            keyOrToken: maskApiKey(cleanTok),
            accountId: maskAccountId(cleanAcc),
            health: 'ACTIVE',
            failureCount: 0,
            label: 'Cloudflare Default Token',
          };
          this.persistVault();
        }
      }

      // 2. Recover other key-based providers if empty
      const keyProviders = [
        {
          id: 'provider-gemini',
          key:
            settings.apiKey && settings.aiProvider === 'gemini'
              ? settings.apiKey
              : settings.apiKeys?.[0],
        },
        {
          id: 'provider-openai',
          key:
            settings.apiKey && settings.aiProvider === 'openai'
              ? settings.apiKey
              : settings.apiKeys?.[0],
        },
        {
          id: 'provider-anthropic',
          key:
            settings.apiKey && settings.aiProvider === 'anthropic'
              ? settings.apiKey
              : settings.apiKeys?.[0],
        },
      ];

      for (const p of keyProviders) {
        if (!this.hasValidCredentials(p.id) && p.key) {
          const cleanKey = p.key.trim();
          if (
            cleanKey &&
            !cleanKey.toLowerCase().includes('sample-') &&
            !cleanKey.includes('•') &&
            !cleanKey.includes('\u2022')
          ) {
            const credId = `cred-${p.id}-default`;
            if (!this.vault[p.id]) this.vault[p.id] = {};
            if (!this.healthState[p.id]) this.healthState[p.id] = {};

            this.vault[p.id][credId] = cleanKey;
            this.healthState[p.id][credId] = {
              id: credId,
              keyOrToken: maskApiKey(cleanKey),
              health: 'ACTIVE',
              failureCount: 0,
              label: 'Default Key',
            };
            this.persistVault();
          }
        }
      }
    } catch (e) {
      console.warn('Could not recover credentials from settings backup', e);
    }
  }

  private persistVault() {
    try {
      localStorage.setItem(
        VAULT_STORAGE_KEY,
        JSON.stringify({
          vault: this.vault,
          cloudflareAccounts: this.cloudflareAccounts,
        })
      );
      localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(this.healthState));
    } catch (e) {
      console.warn('Could not persist credential vault', e);
    }
  }

  public setCredentialsForProvider(
    providerId: string,
    credentials: Array<{ id?: string; keyOrToken: string; accountId?: string; label?: string }>
  ): ProviderCredential[] {
    if (!this.vault[providerId]) this.vault[providerId] = {};
    if (!this.cloudflareAccounts[providerId]) this.cloudflareAccounts[providerId] = {};
    if (!this.healthState[providerId]) this.healthState[providerId] = {};

    const updatedList: ProviderCredential[] = [];

    // Clear old unreferenced credentials
    const activeIds = new Set<string>();

    credentials.forEach((c, index) => {
      const isMaskedKey = c.keyOrToken.includes('•') || c.keyOrToken.includes('\u2022');
      const existingRawKey = c.id ? this.vault[providerId]?.[c.id] : undefined;

      // If incoming key is masked and we have NO existing raw secret in vault, skip it!
      // This prevents phantom masked entries from being stored in healthState without secrets!
      if (isMaskedKey && !existingRawKey) {
        return;
      }

      const credId = c.id || `cred-${providerId}-${Date.now()}-${index}`;
      activeIds.add(credId);

      const finalRawKey = isMaskedKey ? existingRawKey! : c.keyOrToken.trim();
      this.vault[providerId][credId] = finalRawKey;

      if (c.accountId) {
        const isMaskedAccount = c.accountId.includes('•') || c.accountId.includes('\u2022');
        const existingRawAccount = c.id ? this.cloudflareAccounts[providerId]?.[c.id] : undefined;
        const finalRawAccount = isMaskedAccount && existingRawAccount ? existingRawAccount : c.accountId.trim();
        this.cloudflareAccounts[providerId][credId] = finalRawAccount;
      }

      // Preserve existing health or default to ACTIVE
      const existing = this.healthState[providerId][credId];
      const credentialObj: ProviderCredential = {
        id: credId,
        keyOrToken: maskApiKey(finalRawKey),
        accountId: this.cloudflareAccounts[providerId][credId] ? maskAccountId(this.cloudflareAccounts[providerId][credId]) : undefined,
        health: existing ? existing.health : 'ACTIVE',
        lastUsed: existing?.lastUsed,
        cooldownUntil: existing?.cooldownUntil,
        failureCount: existing ? existing.failureCount : 0,
        lastErrorType: existing?.lastErrorType,
        lastErrorMessage: existing?.lastErrorMessage,
        label: c.label || `Credential ${index + 1}`,
      };

      this.healthState[providerId][credId] = credentialObj;
      updatedList.push(credentialObj);
    });

    // Cleanup removed credentials from this provider across vault, cloudflareAccounts, and healthState
    const allKnownIds = new Set([
      ...Object.keys(this.vault[providerId] || {}),
      ...Object.keys(this.healthState[providerId] || {}),
      ...Object.keys(this.cloudflareAccounts[providerId] || {}),
    ]);

    for (const id of allKnownIds) {
      if (!activeIds.has(id)) {
        delete this.vault[providerId]?.[id];
        delete this.cloudflareAccounts[providerId]?.[id];
        delete this.healthState[providerId]?.[id];
      }
    }

    this.persistVault();
    return updatedList;
  }

  public getRawCredential(
    providerId: string,
    credentialId: string
  ): { keyOrToken: string; accountId?: string } | null {
    const key = this.vault[providerId]?.[credentialId];
    if (!key) return null;
    return {
      keyOrToken: key,
      accountId: this.cloudflareAccounts[providerId]?.[credentialId],
    };
  }

  public getNextAvailableCredential(
    providerId: string
  ): { credential: ProviderCredential; rawKey: string; rawAccountId?: string } | null {
    const providerHealth = this.healthState[providerId];
    if (!providerHealth) return null;

    const now = Date.now();
    const credIds = Object.keys(providerHealth);

    // Refresh any cooldowns that have passed
    for (const id of credIds) {
      const cred = providerHealth[id];
      if (
        (cred.health === 'RATE_LIMITED' || cred.health === 'TEMPORARILY_FAILED') &&
        cred.cooldownUntil &&
        now >= cred.cooldownUntil
      ) {
        cred.health = 'ACTIVE';
        cred.cooldownUntil = undefined;
      }
    }

    // Filter candidate credentials: ACTIVE
    const candidates = credIds
      .map(id => providerHealth[id])
      .filter(c => c.health === 'ACTIVE');

    if (candidates.length === 0) {
      // Check if any can be retried as fallback
      const retriable = credIds
        .map(id => providerHealth[id])
        .filter(c => c.health !== 'INVALID' && c.health !== 'DISABLED');

      if (retriable.length === 0) return null;
      // Sort by earliest cooldown
      retriable.sort((a, b) => (a.cooldownUntil || 0) - (b.cooldownUntil || 0));
      for (const chosen of retriable) {
        const raw = this.getRawCredential(providerId, chosen.id);
        if (raw && raw.keyOrToken && !raw.keyOrToken.includes('•') && !raw.keyOrToken.includes('\u2022')) {
          return { credential: chosen, rawKey: raw.keyOrToken, rawAccountId: raw.accountId };
        }
      }
      return null;
    }

    // Sort by least recently used (rotation)
    candidates.sort((a, b) => (a.lastUsed || 0) - (b.lastUsed || 0));
    for (const chosen of candidates) {
      const raw = this.getRawCredential(providerId, chosen.id);
      if (raw && raw.keyOrToken && !raw.keyOrToken.includes('•') && !raw.keyOrToken.includes('\u2022')) {
        return { credential: chosen, rawKey: raw.keyOrToken, rawAccountId: raw.accountId };
      }
    }

    return null;
  }

  public markSuccess(providerId: string, credentialId: string) {
    const cred = this.healthState[providerId]?.[credentialId];
    if (cred) {
      cred.health = 'ACTIVE';
      cred.failureCount = 0;
      cred.lastUsed = Date.now();
      cred.cooldownUntil = undefined;
      cred.lastErrorType = undefined;
      cred.lastErrorMessage = undefined;
      this.persistVault();
    }
  }

  public markRateLimited(
    providerId: string,
    credentialId: string,
    cooldownSeconds: number = 300,
    errorMessage?: string
  ) {
    const cred = this.healthState[providerId]?.[credentialId];
    if (cred) {
      cred.health = 'RATE_LIMITED';
      cred.failureCount += 1;
      cred.cooldownUntil = Date.now() + cooldownSeconds * 1000;
      cred.lastErrorType = 'RATE_LIMITED';
      cred.lastErrorMessage = errorMessage || 'Rate limit or quota threshold reached';
      this.persistVault();
    }
  }

  public markFailed(
    providerId: string,
    credentialId: string,
    errorType: NormalizedErrorType,
    errorMessage?: string
  ) {
    const cred = this.healthState[providerId]?.[credentialId];
    if (!cred) return;

    cred.failureCount += 1;
    cred.lastErrorType = errorType;
    cred.lastErrorMessage = errorMessage || 'Request failed';

    if (errorType === 'AUTH_FAILED') {
      cred.health = 'INVALID';
      cred.cooldownUntil = undefined;
    } else if (errorType === 'RATE_LIMITED' || errorType === 'QUOTA_EXCEEDED') {
      cred.health = 'RATE_LIMITED';
      // Exponential backoff up to 15 mins
      const cooldownSec = Math.min(60 * Math.pow(2, cred.failureCount - 1), 900);
      cred.cooldownUntil = Date.now() + cooldownSec * 1000;
    } else if (errorType === 'NETWORK_ERROR' || errorType === 'SERVER_ERROR') {
      cred.health = 'TEMPORARILY_FAILED';
      cred.cooldownUntil = Date.now() + 60 * 1000; // 1 min cooldown
    }

    this.persistVault();
  }

  public getCredentialsSummary(providerId: string): ProviderCredential[] {
    const list = Object.values(this.healthState[providerId] || []);
    return list.filter(c => {
      const raw = this.vault[providerId]?.[c.id];
      if (!raw || raw.includes('•') || raw.includes('\u2022')) return false;
      if (providerId === 'provider-cloudflare') {
        const rawAcc = this.cloudflareAccounts[providerId]?.[c.id];
        if (!rawAcc || rawAcc.includes('•') || rawAcc.includes('\u2022')) return false;
      }
      return true;
    });
  }

  public hasValidCredentials(providerId: string): boolean {
    const summary = this.getCredentialsSummary(providerId);
    return summary.some(c => c.health === 'ACTIVE' || c.health === 'RATE_LIMITED');
  }
}

export const credentialManager = new CredentialManager();
export default credentialManager;
