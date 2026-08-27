import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "@/lib/ragdb";

function extractYoutubeVideoId(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
  );
  return match ? match[1] : trimmed;
}

const MAX_TRANSCRIPT_LENGTH = 5000;

export const youtubeTranscriptTool = tool(
  async ({ url, userId, conversationId }) => {
    try {
      const numUserId = Number(userId);
      const numConvoId = Number(conversationId);

      // Extract 11-char video ID to guarantee YoutubeTranscript works for shorts, mobile, desktop & raw IDs
      const videoId = extractYoutubeVideoId(url);

      if (!videoId) {
        return "Invalid YouTube video URL or Video ID provided.";
      }

      // 1. Fetch transcript using the extracted video ID directly
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcript || transcript.length === 0) {
        return "No transcript/subtitles are available for this YouTube video.";
      }

      // 2. Convert transcript to text
      const text = transcript
        .map((item) => item.text)
        .join(" ")
        .trim();

      if (!text) {
        return "The video has subtitles, but no readable transcript text was found.";
      }

      // Check if transcript exceeds maximum allowed length for free-tier optimization
      if (text.length > MAX_TRANSCRIPT_LENGTH) {
        return `This YouTube video transcript is too long (${text.length.toLocaleString()} characters). To stay within free-tier embedding & database limits, please provide a shorter video (under ~5 minutes / 5,000 characters).`;
      }

      // 3. Create document with user and conversation metadata
      const document = new Document({
        pageContent: text,
        metadata: {
          userId: numUserId,
          conversationId: numConvoId,
          sourceType: "youtube",
          videoId,
          sourceUrl: url,
        },
      });

      // 4. Split into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 150,
      });

      const chunks = await splitter.splitDocuments([document]);

      // 5. Store in PGVector database
      const vectorStore = await getVectorStore();
      await vectorStore.addDocuments(chunks);

      return `YouTube transcript successfully stored in vector database.
Video ID: ${videoId}
Chunks stored: ${chunks.length}
You can now ask questions about this video using searchDocuments.`;
    } catch (error) {
      console.error("YouTube transcript error:", error);
      return `Could not retrieve or store the YouTube transcript.
Possible reasons:
- The video has no subtitles/captions enabled.
- The video is private or unavailable.
- YouTube rate-limited or blocked the transcript extraction request.`;
    }
  },
  {
    name: "get_youtube_transcript",
    description:
      "Fetch a YouTube video's transcript and store it in the vector database so that it can later be searched using the searchDocuments (RAG) tool.",
    schema: z.object({
      url: z.string().describe("YouTube video URL or Video ID"),
      userId: z
        .union([z.number(), z.string()])
        .describe("The ID of the user requesting transcript storage"),
      conversationId: z
        .union([z.number(), z.string()])
        .describe("The current conversation ID"),
    }),
  },
);
