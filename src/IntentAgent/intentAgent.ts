import axios from "axios";
import * as fs from "fs";

export type ClassifiedIntentFromAgent = {
  userId: string;
  courseId: string;
  summarizedInput: string;
  forumId: string;
  postId: string;
  intent: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export class IntentAgent {
  private apiUrl = process.env.OLLAMA_API_URL || "http://localhost:11434";

  // Read the system prompt from file
  private systemPrompt = fs.readFileSync(
    "./src/IntentAgent/intentAgentPrompt.txt",
    "utf-8"
  );

  // TODO -> Adapt to have the same structure as ProfessorAgent
  async classifyIntent(prompt: string): Promise<ClassifiedIntentFromAgent> {
    try {
      const response = await axios.post(`${this.apiUrl}/generate`, {
        model: "gemma3:4b",
        prompt: `${this.systemPrompt}\n\n${prompt}`,
        stream: false,
      });

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
