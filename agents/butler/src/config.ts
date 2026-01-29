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
  return process.env[key];
}

export const config = {
  microsoft: {
    clientId: () => env("AZURE_CLIENT_ID"),
    tenantId: () => env("AZURE_TENANT_ID"),
    clientSecret: () => env("AZURE_CLIENT_SECRET"),
    tokenCachePath: () => envOptional("MSAL_TOKEN_CACHE_PATH") ?? ".cache/msal.json",
  },
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
  },
} as const;
