import axios from "axios";
import { config } from "./config";

export class OllamaClient {
  private apiUrl = config.ollama.useLocal
    ? config.ollama.localUrl
    : config.ollama.apiUrl;
  private apiKey = config.ollama.apiKey;

  async query(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/generate`,
        { model: "llama3.2", prompt },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.response;
    } catch (error) {
      console.error("Error querying Ollama:", error);
      throw error;
    }
  }
}
