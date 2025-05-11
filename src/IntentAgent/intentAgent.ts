import { config } from "@/config";
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

  async classifyIntent(prompt: string): Promise<any> {
    try {
      const response = await axios.post(`${this.apiUrl}/generate`, {
        model: "llama3.2",
        prompt: `${this.systemPrompt}\n\n${prompt}`,
        stream: false,
      });

      const data = response.data.response;

      return data;
    } catch (error) {
      console.error("Error processing prompt with Ollama:", error);
      throw error;
    }
  }
}
