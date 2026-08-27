import { StateGraph, START, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { allTools } from "./tools";

// ========================================
// 1. LLM & EMBEDDINGS CONFIG
// ========================================

const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
export const embeddingModelName = process.env.EMBEDDING_MODEL || "gemini-embedding-001";

const llm = new ChatGoogleGenerativeAI({
  model: modelName,
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0,
});

const llmWithTools = llm.bindTools(allTools);

export async function generateTitleOverview(prompt: string): Promise<string> {
  try {
    const res = await llm.invoke([
      new SystemMessage(
        "Summarize the user's prompt into a clean 3 to 5 word title for a sidebar navigation list. Return ONLY the concise title string with no quotes, formatting, or extra text."
      ),
      new HumanMessage(prompt.slice(0, 300)),
    ]);
    const title = String(res.content).trim().replace(/^["']|["']$/g, "");
    return title.slice(0, 50) || prompt.slice(0, 50);
  } catch (err) {
    console.error("Failed to generate title overview:", err);
    return prompt.slice(0, 50);
  }
}

// ========================================
// 2. CHATBOT NODE & GRAPH SETUP
// ========================================

async function chatbotNode(state: typeof MessagesAnnotation.State) {
  const response = await llmWithTools.invoke(state.messages);
  return {
    messages: [response],
  };
}

const toolNode = new ToolNode(allTools);

const graph = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", chatbotNode)
  .addNode("tools", toolNode)
  .addEdge(START, "chatbot")
  .addConditionalEdges("chatbot", toolsCondition)
  .addEdge("tools", "chatbot")
  .compile();

// ========================================
// 3. MAIN AGENT RUNNER EXPORT
// ========================================

export interface RunAgentInput {
  messages: BaseMessage[];
  userId: number;
  conversationId: number;
  fileUrl?: string | null;
  fileType?: string | null;
}

export interface AgentResponse {
  content: string;
  type: string;
  file_url: string | null;
}

export async function runAgent({
  messages,
  userId,
  conversationId,
  fileUrl,
  fileType,
}: RunAgentInput): Promise<AgentResponse> {
  const inputMessages = [...messages];

  let systemText = `You are a helpful AI assistant.
Available tools to call:
- searchDocuments: Call this tool when asked questions about uploaded PDFs, document contents, or stored YouTube transcripts. Pass query, userId: ${userId}, conversationId: ${conversationId}.
- generateImage: Call this tool whenever the user asks to generate, create, make, or draw an image.
- analyzeImage: Call this tool when asked about an attached image.
- getWeather: Call this tool for live weather.
- calculator: Call this tool for math calculations.
- tavily_search: Call this tool when asked about recent news, current events, live web facts, or latest real-time information.
- wikipedia_search: Call this tool when asked for general knowledge, encyclopedia articles, historical figures, scientific concepts, or Wikipedia information.
- anime_search: Call this tool when asked for anime details, ratings, episode counts, status, synopses, or anime recommendations.
- github_search: Call this tool when asked for GitHub repositories, open-source code libraries, projects, or developer tools.
- githubRepoTool: Call this tool when asked for detailed information about a specific GitHub repository given its owner and repository name.
- generatePdf: Call this tool whenever the user asks to generate, export, create, make, or write a PDF document, report, or file.
- get_youtube_transcript: Call this tool when given a YouTube video URL to fetch and index its transcript. Pass url, userId: ${userId}, conversationId: ${conversationId}.

NOTE: 'JSON' IS NOT A TOOL. Do NOT attempt to invoke any tool named 'JSON' or 'json'.
We only use JSON formatting to store responses in our database.

CRITICAL INSTRUCTIONS FOR IMAGE/PDF GENERATION & MEDIA HANDLING:
1. If generating an image with generateImage, place the exact returned image URL in "file_url" and set "type": "image" in your final JSON response.
2. If generating a PDF document with generatePdf, place the exact returned PDF URL in "file_url" and set "type": "pdf" in your final JSON response.
3. Do NOT format image or PDF URLs as markdown links inside "content".
4. If the user asks questions about an uploaded PDF document or content, use the searchDocuments tool with userId: ${userId} and conversationId: ${conversationId}.

For your final answer, please format your text response as a raw JSON string matching this schema:
{
  "content": "Your text response or explanation here",
  "type": "text" | "image" | "pdf",
  "file_url": "Exact URL if generated by generateImage/generatePdf tools or attached file, otherwise null"
}`;

  if (fileUrl) {
    systemText += `\nUser attached a ${fileType || "file"}. Attached File URL: ${fileUrl}. If user asks questions about an attached image, call analyzeImage tool with imageUrl: "${fileUrl}".`;
  }

  inputMessages.unshift(new SystemMessage(systemText));

  const result = await graph.invoke({ messages: inputMessages });
  const finalMessage = result.messages.at(-1);
  const rawText = String(finalMessage?.content || "").trim();

  // Strip markdown code block wrappers (e.g. ```json ... ```) if LLM wraps output in backticks
  let cleanText = rawText;
  if (cleanText.startsWith("```")) {
    cleanText = cleanText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  try {
    const parsed = JSON.parse(cleanText);
    return {
      content: parsed.content || cleanText,
      type: parsed.type || "text",
      file_url: parsed.file_url || null,
    };
  } catch {
    return {
      content: cleanText,
      type: "text",
      file_url: null,
    };
  }
}
