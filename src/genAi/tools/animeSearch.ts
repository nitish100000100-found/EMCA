import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const animeSearchTool = tool(
  async ({ query }) => {
    try {
      // 1. Try Jikan API (MyAnimeList)
      try {
        const jikanRes = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=3`,
          { headers: { "User-Agent": "EMCA-App/1.0" } },
        );
        if (jikanRes.ok) {
          const jikanData = await jikanRes.json();
          if (jikanData.data && jikanData.data.length > 0) {
            const formatted = jikanData.data
              .map(
                (a: { title: string; score?: number; episodes?: number; status?: string; type?: string; synopsis?: string; url?: string }, i: number) =>
                  `[${i + 1}] Title: ${a.title}\nScore: ${a.score || "N/A"}/10\nEpisodes: ${a.episodes || "N/A"}\nStatus: ${a.status || "N/A"}\nType: ${a.type || "N/A"}\nSynopsis: ${a.synopsis ? a.synopsis.slice(0, 300) : "N/A"}\nURL: ${a.url || "N/A"}`,
              )
              .join("\n\n");
            return formatted;
          }
        }
      } catch {
        // Fallthrough to Kitsu API if Jikan is temporarily down/504
      }

      // 2. Kitsu Anime API Fallback
      const kitsuRes = await fetch(
        `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(
          query,
        )}&page[limit]=3`,
        { headers: { Accept: "application/vnd.api+json" } },
      );

      if (!kitsuRes.ok) {
        return `Failed to fetch anime information for "${query}".`;
      }

      const kitsuData = await kitsuRes.json();
      const list = kitsuData?.data || [];

      if (list.length === 0) {
        return `No anime found for query: "${query}".`;
      }

      const formattedKitsu = list
        .map(
          (
            item: {
              id: string;
              attributes?: {
                canonicalTitle?: string;
                titles?: { en?: string };
                averageRating?: string;
                episodeCount?: number;
                status?: string;
                subtype?: string;
                synopsis?: string;
              };
            },
            i: number,
          ) => {
            const attr = item.attributes || {};
            return `[${i + 1}] Title: ${
              attr.canonicalTitle || attr.titles?.en || "Unknown"
            }\nScore: ${
              attr.averageRating ? `${attr.averageRating}/100` : "N/A"
            }\nEpisodes: ${attr.episodeCount || "N/A"}\nStatus: ${
              attr.status || "N/A"
            }\nSubtype: ${attr.subtype || "N/A"}\nSynopsis: ${
              attr.synopsis ? attr.synopsis.slice(0, 300) : "N/A"
            }\nURL: https://kitsu.io/anime/${item.id}`;
          },
        )
        .join("\n\n");

      return formattedKitsu;
    } catch (error) {
      console.error("Anime search tool error:", error);
      return `Error searching anime: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "anime_search",
    description:
      "Search anime information, titles, ratings, episode counts, status, synopses, and details.",
    schema: z.object({
      query: z.string().describe("The anime title or search term to look up."),
    }),
  },
);
