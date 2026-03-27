import { MongoClient, ServerApiVersion } from "mongodb";

const MongoDBConfig = {
  serverApi: ServerApiVersion.v1,
};

let client = null;
let db = null;

export default async function ConnectToDatabase() {
  try {
    if (!client || !db) {
      client = new MongoClient(process.env.MONGODB_URL, MongoDBConfig);
      await client.connect();
      db = client.db(process.env.MONGODB_NAME);
    }
    // Test the connection is still alive
    await db.command({ ping: 1 });
    return { client, db };
  } catch (err) {
    // Reset cached client on any error and retry once
    client = null;
    db = null;
    client = new MongoClient(process.env.MONGODB_URL, MongoDBConfig);
    await client.connect();
    db = client.db(process.env.MONGODB_NAME);
    return { client, db };
  }
}