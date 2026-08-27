import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { tavily } from "@tavily/core";

export const tavilySearchTool = tool(
  async ({ query }) => {
    try {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return "Tavily API key is missing in environment variables.";
      }
      const client = tavily({ apiKey });
      const response = await client.search(query, {
        searchDepth: "basic",
        maxResults: 5,
      });

      if (!response.results || response.results.length === 0) {
        return `No web search results found for query: "${query}".`;
      }

      const formattedResults = response.results
        .map(
          (r, i) =>
            `[${i + 1}] Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`,
        )
        .join("\n\n");

      return formattedResults;
    } catch (error) {
      console.error("Tavily search tool error:", error);
      return `Error performing web search: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "tavily_search",
    description:
      "Search the web for latest news, real-time events, current facts, and recent information.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query for live web search and current news/events."),
    }),
  },
);
