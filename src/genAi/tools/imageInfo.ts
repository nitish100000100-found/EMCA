import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const imageInfoTool = tool(
  async ({ imageUrl, question }) => {
    const imgRes = await fetch(imageUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/qwen/qwen3.8-27b`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageDataUrl },
                },
                {
                  type: "text",
                  text: question || "Describe this image briefly.",
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    return data.result?.response || JSON.stringify(data.result);
  },
  {
    name: "analyzeImage",
    description: "Analyze an image from a URL using Cloudflare Qwen Vision model",
    schema: z.object({
      imageUrl: z.string().describe("URL of the image to analyze"),
      question: z.string().optional().describe("Question about the image"),
    }),
  }
);
