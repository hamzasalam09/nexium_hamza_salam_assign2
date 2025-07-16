import { createClient } from '@supabase/supabase-js';

// Supabase configuration interface
interface SupabaseConfig {
  url: string;
  anonKey: string;
  options: {
    auth: {
      autoRefreshToken: boolean;
      persistSession: boolean;
      detectSessionInUrl: boolean;
    };
    db: {
      schema: string;
    };
    global: {
      headers: Record<string, string>;
    };
    realtime: {
      params: {
        eventsPerSecond: number;
      };
    };
  };
}

// Get Supabase configuration with validation
function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL environment variable is required. ' +
      'Please add your Supabase project URL to your environment variables.'
    );
  }

  if (!anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required. ' +
      'Please add your Supabase anon key to your environment variables.'
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
  }

  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Set to false for API usage
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'blog-summarizer-app',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  };

  return { url, anonKey, options };
}

// Create enhanced Supabase client
function createSupabaseClient() {
  const { url, anonKey, options } = getSupabaseConfig();
  
  console.log('Initializing Supabase client...');
  
  return createClient(url, anonKey, options);
}

// Export the Supabase client
export const supabase = createSupabaseClient();

// Health check function
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  tables?: string[];
  version?: string;
  error?: string;
}> {
  try {
    // Test connection by fetching table information
    const { error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);

    if (error) {
      return {
        connected: false,
        error: error.message,
      };
    }

    // Get list of public tables
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    const tableNames = tables?.map(t => t.table_name) || [];

    return {
      connected: true,
      tables: tableNames,
      version: 'Connected', // Supabase doesn't expose version easily
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Database utilities
export async function getSupabaseStats(): Promise<{
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    sizeBytes?: number;
  }>;
  error?: string;
}> {
  try {
    // Get statistics for known tables
    const knownTables = ['blog_summaries']; // Add more tables as needed
    const tableStats = [];

    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          tableStats.push({
            tableName,
            rowCount: count || 0,
          });
        }
      } catch (tableError) {
        // Table might not exist, skip it
        console.warn(`Could not get stats for table ${tableName}:`, tableError);
      }
    }

    return { tableStats };
  } catch (error) {
    return {
      tableStats: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Utility function to test table access
export async function testTableAccess(tableName: string): Promise<{
  readable: boolean;
  writable: boolean;
  error?: string;
}> {
  try {
    // Test read access
    const { error: readError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    const readable = !readError;

    // Test write access with a dry run (we'll immediately rollback)
    let writable = false;
    try {
      const { error: writeError } = await supabase
        .from(tableName)
        .insert({})
        .select()
        .limit(0); // This should fail but tells us about write permissions

      // If we get a validation error, it means we have write access
      writable = writeError?.code !== '42501'; // 42501 is insufficient_privilege
    } catch {
      writable = false;
    }

    return {
      readable,
      writable,
      error: readError?.message,
    };
  } catch (error) {
    return {
      readable: false,
      writable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Enhanced error handler for Supabase operations
export function handleSupabaseError(error: unknown): {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
} {
  if (!error) {
    return { message: 'Unknown error occurred' };
  }

  const err = error as { message?: string; code?: string; details?: string; hint?: string };

  return {
    message: err.message || 'Database operation failed',
    code: err.code,
    details: err.details,
    hint: err.hint,
  };
}

// Batch operation helper
export async function batchOperation<T>(
  operations: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<Array<{ success: boolean; data?: T; error?: string }>> {
  const results = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(op => op())
    );
    
    const processedResults = batchResults.map(result => {
      if (result.status === 'fulfilled') {
        return { success: true, data: result.value };
      } else {
        return { 
          success: false, 
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        };
      }
    });
    
    results.push(...processedResults);
  }
  
  return results;
}

export default supabase;
