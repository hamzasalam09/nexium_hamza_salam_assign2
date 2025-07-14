export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || '',
  },
  cohere: {
    apiKey: process.env.NEXT_PUBLIC_COHERE_API_KEY,
  }
} as const;

// Validate environment variables
export function validateConfig() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'MONGODB_URI',
    'NEXT_PUBLIC_COHERE_API_KEY',
  ] as const;

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
