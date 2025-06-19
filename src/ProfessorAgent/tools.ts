import { MemoryService } from "@/Memory/memoryService";
import { MoodleClient } from "@/Moodle/moodleController";
import { CustomVectorStore } from "@/RAG/vectorStore";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const moodleController = new MoodleClient();
const memoryService = new MemoryService();
const vectorStore = new CustomVectorStore();

export const FetchForumPostsTool = tool(moodleController.getForumPosts, {
  name: "get_forum_posts",
  description: "Call to retrieve posts for a given forumId",
  schema: z.object({
    discussionId: z.string(),
  }),
});

export const GetRelevantKnowledge = tool(
  async ({ query }: { query: string }) => {
    console.log("Recuperando conhecimento relevante para a consulta: ", query);
    return await vectorStore.searchSubjectKnowledge(query);
  },
  {
    name: "getRelevantKnowledgeFromMaterial",
    description:
      "Method to retrieve relevant information from a book containing course-specific content, in order to answer questions, summarize topics, or support research and learning. This tool performs a vector search; use the query parameter to search for specific information.",
    schema: z.object({
      query: z.string(),
    }),
  }
);

export const GetSubjectMetadata = tool(
  async ({ query }: { query: string }) => {
    console.log("Recuperando conhecimento relevante para a consulta: ", query);
    return await vectorStore.searchSubjectMetadata(query);
  },
  {
    name: "getSubjectMetadata",
    description:
      "Chamada para recuperar informações do curso. Incluindo estrutura do curso, tarefas, datas e materiais relacionados. Isso está relacionado ao próprio curso e seus metadados. Para detalhes sobre o curso e datas, use esta ferramenta. Esta ferramenta realizará uma busca vetorial, use o parâmetro de consulta para buscar informações específicas.",
    schema: z.object({
      query: z.string(),
    }),
  }
);

export const GetWeeklySummary = tool(
  async ({ startDate, endDate }: { startDate: string; endDate: string }) =>
    memoryService.summarizeActionsForDateRange(startDate, endDate),
  {
    name: "getWeeklySummary",
    description:
      "Retrieves course information, including structure, assignments, dates, and related materials. Refers to the course itself and its metadata. Use this tool to get details and dates. Performs vector search; provide a query to retrieve specific information.",
    schema: z.object({ startDate: z.string(), endDate: z.string() }),
  }
);
