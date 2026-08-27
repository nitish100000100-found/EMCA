import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { uploadBufferToCloudinary } from "@/lib/clodinary";

export const generateImageTool = tool(
  async ({ prompt }) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      }
    );

    const data = await response.json();
    const imageBuffer = Buffer.from(data.result.image, "base64");

    const result = await uploadBufferToCloudinary(
      imageBuffer,
      `ai-image-${Date.now()}`
    );

    return result.secure_url;
  },
  {
    name: "generateImage",
    description: "Generate an image based on prompt description",
    schema: z.object({
      prompt: z.string().describe("Prompt for image generation"),
    }),
  }
);
