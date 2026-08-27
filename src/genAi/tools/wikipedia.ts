import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const wikipediaTool = tool(
  async ({ query }) => {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(
          query,
        )}&limit=5`,
        {
          headers: {
            "User-Agent": "EMCA-App/1.0 (https://github.com/nitish/EMCA)",
          },
        },
      );

      if (!response.ok) {
        return `Failed to fetch Wikipedia results. Status: ${response.status}`;
      }

      const data = await response.json();
      const pages = data?.pages || [];

      if (pages.length === 0) {
        return `No Wikipedia pages found for "${query}".`;
      }

      const formatted = pages
        .map((p: { key: string; title: string; description?: string; excerpt?: string }, i: number) => {
          const cleanExcerpt = (p.excerpt || "")
            .replace(/<[^>]+>/g, "")
            .trim();
          return `[${i + 1}] Title: ${p.title}\nDescription: ${p.description || "N/A"}\nSummary: ${cleanExcerpt}\nURL: https://en.wikipedia.org/wiki/${encodeURIComponent(p.key)}`;
        })
        .join("\n\n");

      return formatted;
    } catch (error) {
      console.error("Wikipedia tool error:", error);
      return `Error querying Wikipedia: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "wikipedia_search",
    description:
      "Search Wikipedia for encyclopedia articles, historical figures, scientific concepts, and general knowledge.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query for Wikipedia articles."),
    }),
  },
);
