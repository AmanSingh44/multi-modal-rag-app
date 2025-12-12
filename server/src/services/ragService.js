import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { WeaviateStore } from "@langchain/weaviate";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { formatDocumentsAsString } from "langchain/util/document";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config, getWeaviateClient } from "../config/database.js";

dotenv.config();

let embeddings = null;
let vectorStore = null;

//MODEL SELECTION (fast vs normal)
function getDynamicModel(query) {
  const fastKeywords = [
    "asap",
    "fast",
    "quick",
    "quickly",
    "short answer",
    "brief",
    "in short",
  ];

  const lower = query.toLowerCase();
  const wantsFast = fastKeywords.some((k) => lower.includes(k));

  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: wantsFast
      ? process.env.FAST_LLM_MODEL_NAME
      : process.env.LLM_MODEL_NAME,
    temperature: 0.1,
  });
}

// Dynamic system prompt

function dynamicSystemPromptMiddleware(query) {
  const isAdvancedUser = (query || "").length > 150;

  if (isAdvancedUser) {
    return `You are an expert AI assistant with deep technical knowledge.

Previous Conversation:
{conversation_history}

Context from Document:
{context}

Current Question: {question}

Instructions:
- Provide detailed, technical responses with specific terminology
- Include relevant technical details, specifications, and explanations
- Reference specific sections or data points from the context
- Use technical language appropriate for advanced users
- Provide comprehensive answers that cover edge cases and nuances
- If you don't know, say so clearly

Expert Answer:`;
  } else {
    return `You are a helpful AI assistant that explains things clearly and simply.

Previous Conversation:
{conversation_history}

Context from Document:
{context}

Current Question: {question}

Instructions:
- Keep answers concise, clear and as direct as possible
- Use simple language and examples where helpful
- Avoid technical jargon unless necessary
- Focus on the most important information
- Use analogies or examples to clarify concepts
- If you don't know, say so clearly

Helpful Answer:`;
  }
}

//Query rewriting prompt/
const rewritePrompt = PromptTemplate.fromTemplate(`
You are an expert at rewriting user questions to make them more compatible with a RAG search engine.

Rewrite the user query into a clearer, expanded search query that:
- Extracts core meaning
- Adds missing keywords
- Uses synonyms
- Removes ambiguity
- Does NOT answer the question
- Does NOT add fictional details at all 
- Do not add unnecessary questions

Original Question: "{query}"

Rewritten Search Query:
`);

// INIT embeddings + vector store

async function initializeRAG() {
  if (!embeddings) {
    embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: process.env.EMBEDDING_MODEL_NAME,
    });
  }

  if (!vectorStore) {
    const client = await getWeaviateClient();

    vectorStore = await WeaviateStore.fromExistingIndex(embeddings, {
      client,
      indexName: config.className,
      textKey: "pageContent",
      metadataKeys: [
        "source",
        "chunk_id",
        "doc_type",
        "pageNumber",
        "sectionTitle",
        "chunkType",
      ],
    });
  }

  return { vectorStore };
}

function getRewriteModel() {
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: process.env.FAST_LLM_MODEL_NAME,
    temperature: 0.1,
  });
}

//Query rewriting function

async function rewriteQuery(llm, query) {
  const rewriteLLM = getRewriteModel();
  const rewriteChain = RunnableSequence.from([
    { query: new RunnablePassthrough() },
    rewritePrompt,
    rewriteLLM,
    new StringOutputParser(),
  ]);

  const rewritten = await rewriteChain.invoke(query);
  console.log("\n Rewritten Query:", rewritten, "\n");
  return rewritten;
}
function userWantsFastReply(query) {
  if (!query) return false;

  const fastKeywords = [
    "asap",
    "fast",
    "quick",
    "quickly",
    "short answer",
    "brief",
    "in short",
  ];

  const lower = query.toLowerCase();
  return fastKeywords.some((k) => lower.includes(k));
}

/* -------------------------
   ColBERT Reranking Function
   -------------------------*/
async function rerankWithColBERT(query, documents, topK) {
  if (!documents || documents.length === 0) return [];

  const url = process.env.JINA_URL;

  const docTexts = documents.map((d) => d.pageContent);

  const payload = {
    model: process.env.JINA_MODEL_NAME,
    query: query,
    documents: docTexts,
    top_n: topK,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Rerank API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // The API returns a list of "results" with { index, relevance_score }
    // We map these indices back to our original 'documents' array
    const rerankedDocs = data.results.map((result) => {
      const originalDoc = documents[result.index];

      originalDoc.metadata.rerankScore = result.relevance_score;

      return originalDoc;
    });

    console.log(
      `\n Reranked ${documents.length} docs -> keeping top ${rerankedDocs.length}`
    );
    return rerankedDocs; // These are now sorted by ColBERT score
  } catch (error) {
    console.error(
      " Reranking failed, falling back to original order:",
      error.message
    );
    return documents.slice(0, topK); // Fallback: just return the first K from Weaviate
  }
}

// RAG SERVICE

export const ragService = {
  async queryWithHistory(query, historyManager) {
    const { vectorStore } = await initializeRAG();
    const llm = getDynamicModel(query);

    // 1. Rewrite Query
    let rewrittenQuery = query;
    if (!userWantsFastReply(query)) {
      rewrittenQuery = await rewriteQuery(llm, query);
    }

    const conversationContext = historyManager.getLastNExchanges
      ? historyManager.getLastNExchanges(5)
      : null;

    const template = dynamicSystemPromptMiddleware(query);
    const customRagPrompt = PromptTemplate.fromTemplate(template);

    //Retrieval
    // We fetch 20 docs (High Recall) to let ColBERT filter out the noise
    const fetchK = 20;
    const finalK = 5; // We only send the top 5 to the LLM

    let initialResults = [];

    // existing filter logic...
    let filter = null;

    try {
      initialResults = await vectorStore.similaritySearchWithScore(
        rewrittenQuery,
        fetchK,
        { hybrid: true, filter }
      );
    } catch (err) {
      console.log("Hybrid failed, using vector only");
      initialResults = await vectorStore.similaritySearchWithScore(
        rewrittenQuery,
        fetchK
      );
    }

    console.log("\n Retrieved Context Chunks from Vector DB:");
    initialResults.forEach(([doc, score], i) => {
      console.log(`--- Chunk ${i + 1} ---`);
      console.log("score :", score);
      console.log("chunk_id:", doc.metadata?.chunk_id);
      console.log(doc.pageContent || doc.content || "");
    });

    // Unwrap the Weaviate results (Doc + Score tuple) to just Docs
    const rawDocs = initialResults.map(([doc, score]) => {
      // Optional: Store initial Weaviate score for comparison
      doc.metadata.initialScore = score;
      return doc;
    });

    console.log(`\n Sending ${rawDocs.length} chunks to ColBERT reranker...`);

    // This sorts the docs based on their actual meaning match
    const finalDocs = await rerankWithColBERT(rewrittenQuery, rawDocs, finalK);

    console.log("\n--- Final Context (Post-Reranking) ---");
    finalDocs.forEach((d, i) => {
      console.log(
        `\n[Rank ${i + 1}] Score: ${d.metadata.rerankScore?.toFixed(4)}`
      );
      console.log(`ID: ${d.metadata?.chunk_id}`);
      console.log(`Content: ${d.pageContent || ""}`);
    });

    const contextString = formatDocumentsAsString(finalDocs);

    //main
    const ragChain = RunnableSequence.from([
      {
        context: () => contextString,
        question: new RunnablePassthrough(),
        conversation_history: () => conversationContext || "No history",
      },
      customRagPrompt,
      llm,
      new StringOutputParser(),
    ]);

    const answer = await ragChain.invoke(rewrittenQuery);

    if (historyManager?.addExchange) {
      historyManager.addExchange(rewrittenQuery, answer);
    }

    return { rewrittenQuery, answer, model: llm.model };
  },
};
