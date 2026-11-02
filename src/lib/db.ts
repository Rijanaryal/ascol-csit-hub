import { GridFSBucket, MongoClient } from "mongodb";

let clientPromise: Promise<MongoClient> | undefined;

export async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Add it to .env.local.");
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect().catch((error: unknown) => {
      clientPromise = undefined;
      throw error;
    });
  }
  const connectedClient = await clientPromise;
  return connectedClient.db(process.env.MONGODB_DATABASE || "ascol_csit_hub");
}

export async function getUploadsBucket() {
  return new GridFSBucket(await getDatabase(), { bucketName: "assignment_files" });
}

export async function getResourceFilesBucket() {
  return new GridFSBucket(await getDatabase(), { bucketName: "campus_resource_files" });
}
