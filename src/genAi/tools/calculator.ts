import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const calculatorTool = tool(
  async ({ a, b, operation }) => {
    if (operation === "add") return String(a + b);
    if (operation === "subtract") return String(a - b);
    if (operation === "multiply") return String(a * b);
    if (operation === "divide") {
      if (b === 0) return "Cannot divide by zero";
      return String(a / b);
    }
    return "Unknown operation";
  },
  {
    name: "calculator",
    description: "Perform basic mathematical calculations (add, subtract, multiply, divide)",
    schema: z.object({
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
      operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("Mathematical operation"),
    }),
  }
);
