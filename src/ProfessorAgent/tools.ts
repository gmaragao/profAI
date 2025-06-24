import { MemoryService } from "@/Memory/memoryService";
import { CustomVectorStore } from "@/RAG/vectorStore";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const vectorStore = new CustomVectorStore();
const memoryService = new MemoryService();

export const GetRelevantKnowledge = tool(
  async ({ query }: { query: string }) => {
    console.log("Getting relevant knowledge: ", query);
    return await vectorStore.searchSubjectKnowledge(query);
  },
  {
    name: "getRelevantKnowledgeFromMaterial",
    description:
      "Use para recuperar conteúdo da disciplina a partir de materiais como livros, apostilas, slides ou anotações de aula. Utilize esta ferramenta para responder perguntas sobre conceitos, teorias, definições ou explicações relacionadas ao conteúdo estudado. Forneça uma consulta descrevendo o tema ou a dúvida.",
    schema: z.object({
      query: z.string(),
    }),
  }
);

export const GetSubjectMetadata = tool(
  async ({ query }: { query: string }) => {
    console.log("Getting subject metadata: ", query);
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

// Not being used -- but implemented for future use
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
