import { MongoClient } from 'mongodb';

let clientPromise: Promise<MongoClient>;

// Handle build-time gracefully
if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not found - this is expected during build time');
  // Create a dummy promise that resolves to null
  clientPromise = Promise.resolve(null as any);
} else {
  const uri = process.env.MONGODB_URI;
  const options = {};

  let client;

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = MongoClient.connect(uri, options);
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise; 