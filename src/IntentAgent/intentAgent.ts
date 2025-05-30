import { config } from "@/config";
import { ClassifiedResponse } from "@/middleware/types";
import axios from "axios";
import * as fs from "fs";

export class IntentAgent {
  private apiUrl = config.ollama.useLocal
    ? config.ollama.localUrl
    : config.ollama.apiUrl;
  private apiKey = config.ollama.apiKey;

  // Read the system prompt from file
  private systemPrompt = fs.readFileSync(
    "./src/IntentAgent/intentAgentPrompt.txt",
    "utf-8"
  );

  async classifyIntent(prompt: string): Promise<ClassifiedResponse> {
    try {
      const response = await axios.post(`${this.apiUrl}/generate`, {
        model: "gemma3:4b",
        prompt: `${this.systemPrompt}\n\n${prompt}`,
        stream: false,
      });

      const data = response.data.response;
      // Remove triple backticks and optional "json" label
      const cleaned = data
        .trim()
        .replace(/^```json\s*/i, "") // Remove starting ```json (case-insensitive)
        .replace(/```$/, ""); // Remove ending ```

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Error processing prompt with Ollama:", error);
      throw error;
    }
  }
}
