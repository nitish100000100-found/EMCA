import pool from "@/lib/db";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.EMBEDDING_MODEL || "text-embedding-004",
});

async function getVectorStore() {
  return await PGVectorStore.initialize(embeddings, {
    pool: pool,
    tableName: "documents",
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
  });
}

async function getRetriever(
  userId: number | string,
  conversationId?: number | string,
  k: number = 5
) {
  const vectorStore = await getVectorStore();
  
  const filter: Record<string, any> = { userId };
  if (conversationId) {
    filter.conversationId = conversationId;
  }

  return vectorStore.asRetriever({
    k: k,
    filter: filter,
  });
}


export{getRetriever,getVectorStore,embeddings}