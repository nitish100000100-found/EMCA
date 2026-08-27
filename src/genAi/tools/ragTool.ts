import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getRetriever } from "@/lib/ragdb";

export const ragTool = tool(
  async ({ query, userId, conversationId }) => {
    try {
      const numUserId = Number(userId);
      const numConvoId = Number(conversationId);
      const retriever = await getRetriever(numUserId, numConvoId);
      const docs = await retriever.invoke(query);

      if (!docs || docs.length === 0) {
        return "No relevant information found in uploaded documents.";
      }

      return docs.map((doc, idx) => `[Excerpt ${idx + 1}]: ${doc.pageContent}`).join("\n\n");
    } catch (error) {
      console.error("RAG Tool Error:", error);
      return "Failed to retrieve documents from vector database.";
    }
  },
  {
    name: "searchDocuments",
    description: "Search and retrieve relevant text chunks from uploaded PDF documents for the current user and conversation.",
    schema: z.object({
      query: z.string().describe("The question or search query to look up in the uploaded documents"),
      userId: z.union([z.number(), z.string()]).describe("The ID of the user requesting document search"),
      conversationId: z.union([z.number(), z.string()]).describe("The current conversation ID"),
    }),
  }
);
