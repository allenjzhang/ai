/**
 * Environment and runtime configuration.
 */
function env(key: string): string {
  const v = process.env[key];
  if (v === undefined || v === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
}

function envOptional(key: string): string | undefined {
  const v = process.env[key];
  return v === "" ? undefined : v;
}

/** Microsoft auth config; undefined if any required env var is missing. */
export function getMicrosoftAuth():
  | { clientId: string; tenantId: string; clientSecret: string; tokenCachePath: string }
  | undefined {
  const clientId = envOptional("AZURE_CLIENT_ID");
  const tenantId = envOptional("AZURE_TENANT_ID");
  const clientSecret = envOptional("AZURE_CLIENT_SECRET");
  if (!clientId || !tenantId || !clientSecret) return undefined;
  return {
    clientId,
    tenantId,
    clientSecret,
    tokenCachePath: envOptional("MSAL_TOKEN_CACHE_PATH") ?? ".cache/msal-tokens.json",
  };
}

/** Google auth config; undefined if any required env var is missing. */
export function getGoogleAuth():
  | { clientId: string; clientSecret: string; redirectUri: string; tokenPath: string }
  | undefined {
  const clientId = envOptional("GOOGLE_CLIENT_ID");
  const clientSecret = envOptional("GOOGLE_CLIENT_SECRET");
  const redirectUri = envOptional("GOOGLE_REDIRECT_URI");
  if (!clientId || !clientSecret || !redirectUri) return undefined;
  return {
    clientId,
    clientSecret,
    redirectUri,
    tokenPath: envOptional("GOOGLE_TOKEN_PATH") ?? ".cache/google-tokens.json",
  };
}

/** Azure OpenAI config; throws if any required env var is missing. */
function getAzureOpenAI() {
  return {
    endpoint: env("AZURE_OPENAI_ENDPOINT"),
    apiKey: env("AZURE_OPENAI_API_KEY"),
    deployment: env("AZURE_OPENAI_DEPLOYMENT_NAME"),
  };
}

export const config = {
  /** Use getMicrosoftAuth() to optionally skip when not configured. */
  microsoft: {
    clientId: () => env("AZURE_CLIENT_ID"),
    tenantId: () => env("AZURE_TENANT_ID"),
    clientSecret: () => env("AZURE_CLIENT_SECRET"),
    tokenCachePath: () => envOptional("MSAL_TOKEN_CACHE_PATH") ?? ".cache/msal-tokens.json",
  },
  /** Use getGoogleAuth() to optionally skip when not configured. */
  google: {
    clientId: () => env("GOOGLE_CLIENT_ID"),
    clientSecret: () => env("GOOGLE_CLIENT_SECRET"),
    redirectUri: () => env("GOOGLE_REDIRECT_URI"),
    tokenPath: () => envOptional("GOOGLE_TOKEN_PATH") ?? ".cache/google-tokens.json",
  },
  azureOpenAI: {
    endpoint: () => env("AZURE_OPENAI_ENDPOINT"),
    apiKey: () => env("AZURE_OPENAI_API_KEY"),
    deployment: () => env("AZURE_OPENAI_DEPLOYMENT_NAME"),
    apiVersion: () => envOptional("AZURE_OPENAI_API_VERSION") ?? "2024-02-15-preview",
  },
  getMicrosoftAuth,
  getGoogleAuth,
  getAzureOpenAI,
} as const;
