export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || '',
  },
  cohere: {
    apiKey: process.env.NEXT_PUBLIC_COHERE_API_KEY || '',
  }
} as const;

// Validate environment variables - returns validation results instead of throwing
export function validateConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'MONGODB_URI',
    'NEXT_PUBLIC_COHERE_API_KEY',
  ] as const;

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}
