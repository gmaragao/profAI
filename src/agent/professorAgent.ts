import { config } from "@/config";
import axios from "axios";
import * as fs from "fs";

export interface ProfessorAction {
  action: {
    type: string;
    confidence: number;
    message: string;
    targetId: string;
    metadata: {
      priority: "high" | "medium" | "low";
      timeEstimate: string;
      knowledgeAreas: string[];
    };
  };
  reasoning: string;
}

export class ProfessorAgent {
  private apiUrl = config.ollama.useLocal
    ? config.ollama.localUrl
    : config.ollama.apiUrl;
  private apiKey = config.ollama.apiKey;

  // Read the system prompt from file
  private systemPrompt = fs.readFileSync(
    "./src/agent/professorSystemPrompt.txt",
    "utf-8"
  );

  async determineAction(context: any): Promise<ProfessorAction> {
    try {
      const formattedContext = JSON.stringify(context);
      const response = await axios.post(
        `${this.apiUrl}/generate`,
        {
          model: "llama3.2",
          prompt: `${this.systemPrompt}\n\nCONTEXT:\n${formattedContext}`,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const responseData = response.data.response;

      try {
        // Parse the JSON response
        const actionData = JSON.parse(responseData) as ProfessorAction;
        return actionData;
      } catch (parseError) {
        console.error("Error parsing professor agent response:", parseError);
        // Return a fallback response if parsing fails
        return {
          action: {
            type: "no_action",
            confidence: 0.1,
            message: "Unable to process response",
            targetId: "",
            metadata: {
              priority: "low",
              timeEstimate: "0",
              knowledgeAreas: [],
            },
          },
          reasoning: "Error processing response from model",
        };
      }
    } catch (error) {
      console.error("Error getting action from Professor Agent:", error);
      throw error;
    }
  }
}
