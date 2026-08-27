import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const githubSearchTool = tool(
  async ({ query }) => {
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "EMCA-App/1.0",
      };

      if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(
          query,
        )}&per_page=10`,
        { headers },
      );

      if (!response.ok) {
        return `GitHub API error: ${response.status} ${response.statusText}`;
      }

      const data = await response.json();
      const items = data?.items || [];

      if (items.length === 0) {
        return `No GitHub repositories found for query: "${query}".`;
      }

      const formatted = items
        .slice(0, 10)
        .map(
          (
            repo: {
              full_name: string;
              description?: string;
              stargazers_count: number;
              language?: string;
              html_url: string;
            },
            i: number,
          ) =>
            `[${i + 1}] ${repo.full_name}\nStars: ⭐ ${
              repo.stargazers_count
            } | Language: ${repo.language || "N/A"}\nDescription: ${
              repo.description || "No description provided."
            }\nURL: ${repo.html_url}`,
        )
        .join("\n\n");

      return formatted;
    } catch (error) {
      console.error("GitHub search tool error:", error);
      return `Error searching GitHub: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "github_search",
    description:
      "Search open-source GitHub repositories, projects, code libraries, stars, and repository links.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query for GitHub repositories or libraries."),
    }),
  },
);
