import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const githubRepoTool = tool(
  async ({ owner, repo }) => {
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "EMCA-App/1.0",
      };

      if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers },
      );

      if (!response.ok) {
        return `GitHub API error: ${response.status} ${response.statusText}`;
      }

      const data = await response.json();

      let readme: string | null = null;
      try {
        const readmeResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/readme`,
          { headers },
        );

        if (readmeResponse.ok) {
          const readmeData = await readmeResponse.json();
          const decoded = Buffer.from(
            readmeData.content,
            "base64",
          ).toString("utf-8");

          readme =
            decoded.length > 2500
              ? decoded.slice(0, 2500) + "\n\n...[README Truncated]"
              : decoded;
        }
      } catch (err) {
        console.warn("Failed to fetch README:", err);
      }

      const details = {
        name: data.name,
        fullName: data.full_name,
        description: data.description || "No description provided.",
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language || "N/A",
        url: data.html_url,
        topics: data.topics || [],
        license: data.license?.name ?? "None",
        readme: readme || "No README available.",
      };

      return JSON.stringify(details, null, 2);
    } catch (error) {
      return `Error fetching repository details: ${
        error instanceof Error ? error.message : "Failed to fetch repository"
      }`;
    }
  },
  {
    name: "githubRepoTool",
    description:
      "Get detailed information and README content for a specific GitHub repository given its owner and repository name.",
    schema: z.object({
      owner: z.string().describe("GitHub repository owner or organization"),
      repo: z.string().describe("GitHub repository name"),
    }),
  },
);
