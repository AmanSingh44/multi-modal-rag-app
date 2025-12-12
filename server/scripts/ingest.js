//ingestion file to ingest file or files run `node ingest.js "./path/file1" "./path/file2"...`

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { WeaviateStore } from "@langchain/weaviate";
import { getWeaviateClient, config } from "../src/config/database";

dotenv.config();

//removing file extension
function getExt(filePath) {
  return path.extname(filePath).toLowerCase();
}

//remove old data(for resetting)
async function clearExistingData() {
  console.log(`  Deleting entire collection: ${config.className}`);

  const client = await getWeaviateClient();

  try {
    const exists = await client.collections.exists(config.className);
    if (!exists) {
      console.log(" Collection does not exist. Nothing to delete.");
      return;
    }

    await client.collections.delete(config.className);

    console.log("  Collection deleted successfully.");
  } catch (err) {
    console.error(" Failed to delete collection:", err.message);
  }
}

//split and load pdf
async function loadPDF(filePath) {
  console.log(` Loading PDF: ${filePath}`);

  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdf(dataBuffer);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitText(pdfData.text);

  return chunks.map((text, i) => ({
    pageContent: text,
    metadata: {
      source: filePath,
      chunk_id: i,
      doc_type: "pdf",
    },
  }));
}

//load json
async function loadJSON(filePath) {
  console.log(` Loading JSON: ${filePath}`);

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!Array.isArray(raw)) throw new Error("JSON must be an array");

  return raw.map((item, i) => ({
    pageContent: item.text || "",
    metadata: {
      source: filePath,
      chunk_id: i,
      doc_type: "json",
    },
  }));
}

//load csv
async function loadCSV(filePath) {
  console.log(`Loading CSV: ${filePath}`);

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim() !== "");

  return lines.map((row, i) => ({
    pageContent: row,
    metadata: {
      source: filePath,
      chunk_id: i,
      doc_type: "csv",
    },
  }));
}

//ingestion file
async function ingestFile(filePath) {
  const ext = getExt(filePath);

  let docs = [];

  if (ext === ".pdf") docs = await loadPDF(filePath);
  else if (ext === ".json") docs = await loadJSON(filePath);
  else if (ext === ".csv") docs = await loadCSV(filePath);
  else throw new Error("Unsupported file type: " + ext);

  console.log(` Prepared ${docs.length} chunks`);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: process.env.EMBEDDING_MODEL_NAME,
  });

  const client = await getWeaviateClient();

  console.log(" Uploading to Weaviate...");

  await WeaviateStore.fromDocuments(docs, embeddings, {
    client,
    indexName: config.className,
    textKey: "pageContent",
    metadataKeys: ["source", "chunk_id", "doc_type"],
  });

  console.log(` Uploaded ${docs.length} chunks from: ${filePath}\n`);
}

//main function
async function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log(' Provide files: node ingest.js "./file.pdf" "./file.json"');
    process.exit(1);
  }

  // clear data to reset
  //await clearExistingData();

  for (const file of files) {
    await ingestFile(file);
  }

  console.log(" ALL INGESTIONS COMPLETE");
  process.exit(0);
}

main();
