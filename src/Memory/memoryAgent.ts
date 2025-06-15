import { config } from "@/config";
import axios from "axios";
import * as fs from "fs";

export class MemoryAgent {
  private apiUrl = config.ollama.useLocal
    ? config.ollama.localUrl
    : config.ollama.apiUrl;
  private apiKey = config.ollama.apiKey;

  // Read the system prompt from file
  private systemPrompt = fs.readFileSync(
    "./src/Memory/memoryAgentSystemPrompt.txt",
    "utf-8"
  );

  async summarize(prompt: string): Promise<WeeklySummary> {
    try {
      console.log("Summarizing week...");
      const response = await axios.post(`${this.apiUrl}/generate`, {
        model: "gemma3:4b",
        prompt: `${this.systemPrompt}\n\n${prompt}`,
        stream: false,
      });

      console.log(
        "Response received from Ollama while summarizing week:",
        response.data
      );
      const data = response.data.response;
      const cleaned = data
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "");

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Error processing prompt with Ollama:", error);
      throw error;
    }
  }
}
