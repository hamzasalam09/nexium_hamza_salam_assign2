import { MongoClient, MongoClientOptions } from 'mongodb';

// Global MongoDB client promise to prevent multiple connections
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Configuration interface
interface MongoConfig {
  uri: string;
  options: MongoClientOptions;
}

// MongoDB connection configuration
function getMongoConfig(): MongoConfig {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is required. ' +
      'Please add your MongoDB connection string to your environment variables.'
    );
  }

  // Enhanced connection options for production use
  const options: MongoClientOptions = {
    // Connection pool settings
    maxPoolSize: 10,          // Maintain up to 10 socket connections
    minPoolSize: 2,           // Maintain at least 2 socket connections
    maxIdleTimeMS: 30000,     // Close connections after 30 seconds of inactivity
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000,   // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 10000,  // Give up initial connection after 10 seconds
    
    // Resilience settings
    heartbeatFrequencyMS: 10000, // Heartbeat every 10 seconds
    retryWrites: true,        // Retry failed writes
    retryReads: true,         // Retry failed reads
    
    // Compression for better performance
    compressors: ['snappy', 'zlib'],
    
    // Additional options for reliability
    w: 'majority',            // Write concern
    readPreference: 'primary', // Read from primary by default
  };

  return { uri, options };
}

// Create MongoDB client with enhanced configuration
function createMongoClient(): Promise<MongoClient> {
  const { uri, options } = getMongoConfig();
  
  console.log('Initializing MongoDB connection...');
  
  const client = new MongoClient(uri, options);
  
  // Add connection event listeners for monitoring
  client.on('serverOpening', () => {
    console.log('MongoDB server connection opening...');
  });
  
  client.on('serverClosed', () => {
    console.log('MongoDB server connection closed');
  });
  
  client.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });
  
  client.on('timeout', () => {
    console.warn('MongoDB connection timeout');
  });
  
  return client.connect();
}

// Get or create MongoDB client promise
function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable to preserve the value
    // across module reloads caused by HMR (Hot Module Replacement)
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createMongoClient();
    }
    return global._mongoClientPromise;
  } else {
    // In production mode, create a new client for each instance
    return createMongoClient();
  }
}

// Export the client promise
const clientPromise = getClientPromise();

// Health check function
export async function checkMongoHealth(): Promise<{
  connected: boolean;
  database?: string;
  collections?: number;
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const admin = client.db().admin();
    const result = await admin.ping();
    
    if (result.ok === 1) {
      const dbName = client.db().databaseName;
      const collections = await client.db().listCollections().toArray();
      
      return {
        connected: true,
        database: dbName,
        collections: collections.length,
      };
    } else {
      return {
        connected: false,
        error: 'Ping failed',
      };
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Graceful shutdown function
export async function closeMongoConnection(): Promise<void> {
  try {
    const client = await clientPromise;
    await client.close();
    console.log('MongoDB connection closed gracefully');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

// Database statistics function
export async function getMongoStats(): Promise<{
  serverStatus: Record<string, unknown> | null;
  dbStats: Record<string, unknown> | null;
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const admin = client.db().admin();
    
    const [serverStatus, dbStats] = await Promise.all([
      admin.serverStatus(),
      client.db().stats(),
    ]);
    
    return {
      serverStatus: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections,
        memory: serverStatus.mem,
      },
      dbStats: {
        collections: dbStats.collections,
        objects: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
      },
    };
  } catch (error) {
    return {
      serverStatus: null,
      dbStats: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default clientPromise;
