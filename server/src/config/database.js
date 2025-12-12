//import { VectorIndexType } from "chromadb";
import dotenv from "dotenv";
import weaviate from "weaviate-client";

dotenv.config();

export const config = {
  weaviateUrl: process.env.WEAVIATE_URL,
  weaviateApiKey: process.env.WEAVIATE_API_KEY,
  className: process.env.WEAVIATE_CLASS_NAME,
};

let weaviateClient = null;

// Get or create Weaviate client

export async function getWeaviateClient() {
  if (!weaviateClient) {
    // Properly parse URL
    const rawUrl = process.env.WEAVIATE_URL;
    const parsed = new URL(rawUrl);

    const host = process.env.WEAVIATE_HOST;
    const port = process.env.WEAVIATE_PORT;

    weaviateClient = await weaviate.connectToLocal({
      host,
      port,
      grpcHost: host,
      grpcPort: process.env.WEAVIATE_GRPC_PORT,
    });
  }
  return weaviateClient;
}

// Create schema for documents

export async function createSchema() {
  const client = await getWeaviateClient();

  try {
    const exists = await client.collections.exists(config.className);

    if (!exists) {
      await client.collections.create({
        name: config.className,
        description: "RAG documents collection with enhanced metadata",

        vectorizers: weaviate.configure.vectorizer.none(),
        //VectorIndexType: "hnsw",

        properties: [
          {
            name: "pageContent",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Raw text of the chunk",
          },
          {
            name: "source",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Source PDF filepath",
          },
          {
            name: "chunk_id",
            dataType: weaviate.configure.dataType.INT,
            description: "Chunk index for local navigation",
          },
          {
            name: "doc_type",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Document type ",
          },

          {
            name: "pageNumber",
            dataType: weaviate.configure.dataType.INT,
            description: "Page number in the original PDF",
          },
          {
            name: "sectionTitle",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Heading/section title detected from text",
          },
          {
            name: "chunkType",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Chunk type: header/table/body",
          },
        ],
      });

      console.log(` Created Weaviate collection: ${config.className}`);
    } else {
      console.log(` Collection ${config.className} already exists`);
    }
  } catch (error) {
    console.error("Error creating schema:", error.message);
    throw error;
  }
}

// Delete schema/collection

export async function deleteSchema() {
  const client = await getWeaviateClient();

  try {
    const exists = await client.collections.exists(config.className);

    if (exists) {
      await client.collections.delete(config.className);
      console.log(` Deleted collection: ${config.className}`);
    } else {
      console.log(`  Collection ${config.className} doesn't exist`);
    }
  } catch (error) {
    console.log(`  Error deleting collection:`, error.message);
  }
}
