import { CustomVectorStore } from "@/RAG/vectorStore.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GetRelevantKnowledge, GetSubjectMetadata } from "./tools";

describe("ProfessorAgent Tools", () => {
  // Spy on console.log
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockClear();
  });

  describe("GetRelevantKnowledge", () => {
    it("should have correct schema and metadata", () => {
      expect(GetRelevantKnowledge.name).toBe(
        "getRelevantKnowledgeFromMaterial"
      );
      expect(GetRelevantKnowledge.description).toContain(
        "Utilize esta ferramenta para responder perguntas sobre conceitos, teorias, definições ou explicações relacionadas ao conteúdo estudado."
      );
      expect(GetRelevantKnowledge.schema.shape).toHaveProperty("query");
    });

    it("should call vectorStore.searchSubjectKnowledge with query parameter", async () => {
      // Spy on prototype directly
      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectKnowledge")
        .mockResolvedValue("Mocked knowledge");

      const result = await GetRelevantKnowledge.invoke({
        query: "film analysis",
      });

      expect(searchSpy).toHaveBeenCalledWith("film analysis");
      expect(result).toBe("Mocked knowledge");
    });

    it("should handle empty query parameters", async () => {
      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectKnowledge")
        .mockResolvedValue("General course information");

      const result = await GetRelevantKnowledge.invoke({ query: "" });

      // Should still call vector store with empty string
      expect(searchSpy).toHaveBeenCalledWith("");
      expect(result).toBe("General course information");
    });

    it("should handle undefined search results", async () => {
      // Setup spy to return undefined
      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectKnowledge")
        .mockResolvedValue(undefined);

      const result = await GetRelevantKnowledge.invoke({
        query: "nonexistent topic",
      });

      expect(searchSpy).toHaveBeenCalledWith("nonexistent topic");
      expect(result).toBeUndefined();
    });

    it("should handle special characters in query", async () => {
      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectKnowledge")
        .mockResolvedValue("Special results");

      const result = await GetRelevantKnowledge.invoke({
        query: "search with special chars: !@#$%",
      });

      // Should pass the special characters unchanged to the vector store
      expect(searchSpy).toHaveBeenCalledWith(
        "search with special chars: !@#$%"
      );
      expect(result).toBe("Special results");
    });
  });

  describe("GetSubjectMetadata", () => {
    it("should have correct schema and metadata", () => {
      expect(GetSubjectMetadata.name).toBe("getSubjectMetadata");
      expect(GetSubjectMetadata.description).toContain(
        "recuperar informações do curso"
      );
      expect(GetSubjectMetadata.schema.shape).toHaveProperty("query");
    });

    it("should call vectorStore.searchSubjectMetadata with query parameter", async () => {
      // Spy on prototype directly
      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectMetadata")
        .mockResolvedValue(
          "Course structure: 12 weeks with final exam on November 10th"
        );

      // Call the tool
      const result = await GetSubjectMetadata.invoke({ query: "exam date" });

      // Verify console log was called
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Getting subject metadata: ",
        "exam date"
      );

      // Verify vector store search was called
      expect(searchSpy).toHaveBeenCalledWith("exam date");

      // Verify the result
      expect(result).toBe(
        "Course structure: 12 weeks with final exam on November 10th"
      );
    });

    it("should handle errors from vector store search", async () => {
      // Setup spy to throw an error
      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectMetadata")
        .mockRejectedValue(new Error("Metadata search failed"));

      // Verify the tool propagates the error
      await expect(
        GetSubjectMetadata.invoke({ query: "error test" })
      ).rejects.toThrow("Metadata search failed");

      // Verify vector store was still called with correct parameters
      expect(searchSpy).toHaveBeenCalledWith("error test");
    });

    it("should handle long query parameters", async () => {
      const longQuery =
        "This is a very long query that contains multiple sentences and should test the robustness of the search functionality. It includes various details about the course structure, assignments, and specific questions about the exam dates and format.";

      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectMetadata")
        .mockResolvedValue("Comprehensive course information");

      const result = await GetSubjectMetadata.invoke({ query: longQuery });

      // Should handle the long query correctly
      expect(searchSpy).toHaveBeenCalledWith(longQuery);
      expect(result).toBe("Comprehensive course information");
    });

    it("should handle multilingual query parameters", async () => {
      const portugueseQuery = "data do exame final";

      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectMetadata")
        .mockResolvedValue("Data do exame final: 10 de novembro");

      const result = await GetSubjectMetadata.invoke({
        query: portugueseQuery,
      });

      expect(searchSpy).toHaveBeenCalledWith(portugueseQuery);
      expect(result).toBe("Data do exame final: 10 de novembro");
    });
  });

  describe("Tool integration in the agent workflow", () => {
    it("should be callable through LangChain's tool interface", async () => {
      // Setup spy
      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectKnowledge")
        .mockResolvedValue("Result");

      // Tools should have the standard LangChain tool interface
      expect(typeof GetRelevantKnowledge.invoke).toBe("function");
      expect(GetRelevantKnowledge).toHaveProperty("name");
      expect(GetRelevantKnowledge).toHaveProperty("description");
      expect(GetRelevantKnowledge).toHaveProperty("schema");

      // Should be callable with object parameters
      const result = await GetRelevantKnowledge.invoke({ query: "test" });
      expect(searchSpy).toHaveBeenCalledWith("test");
      expect(result).toBe("Result");
    });

    it("should validate input parameters", async () => {
      const searchSpy = vi
        .spyOn(CustomVectorStore.prototype, "searchSubjectMetadata")
        .mockResolvedValue("Valid result");

      // @ts-ignore - intentionally omitting required parameter
      await expect(GetSubjectMetadata.invoke({})).rejects.toThrow();

      // Correct parameters should work
      const result = await GetSubjectMetadata.invoke({ query: "valid query" });
      expect(searchSpy).toHaveBeenCalledWith("valid query");
      expect(result).toBe("Valid result");
    });
  });
});
