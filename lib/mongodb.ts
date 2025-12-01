import { MongoClient, MongoClientOptions } from 'mongodb';

let clientPromise: Promise<MongoClient | null>;

// Handle build-time gracefully
if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not found - this is expected during build time');
  // Create a dummy promise that resolves to null
  clientPromise = Promise.resolve(null);
} else {
  const uri = process.env.MONGODB_URI;
  
  // Enhanced connection options for better performance and reliability
  const options: MongoClientOptions = {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 2, // Maintain at least 2 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    serverSelectionTimeoutMS: 5000, // How long to try selecting a server
    socketTimeoutMS: 45000, // How long a send or receive on a socket can take before timeout
    connectTimeoutMS: 10000, // How long to wait for initial connection
    retryWrites: true, // Retry writes on network errors
    retryReads: true, // Retry reads on network errors
  };

  let client: MongoClient | undefined;

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = globalThis as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = MongoClient.connect(uri, options);
    }
    clientPromise = globalWithMongo._mongoClientPromise || Promise.resolve(null);
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to check database connection health
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await clientPromise;
    if (!client) {
      return false;
    }
    await client.db().admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
} 