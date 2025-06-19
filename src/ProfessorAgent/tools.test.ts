import { MemoryService } from "@/Memory/memoryService.js";
import { MoodleClient } from "@/Moodle/moodleController.js";
import { CustomVectorStore } from "@/RAG/retriever.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FetchForumPostsTool,
  GetRelevantKnowledge,
  GetSubjectMetadata,
  GetWeeklySummary,
} from "./tools.js";

vi.mock("@/Moodle/moodleController");
vi.mock("@/Memory/memoryService");
vi.mock("@/RAG/vectorStore");

describe("ProfessorAgent Tools", () => {
  let mockMoodleClient: any;
  let mockMemoryService: any;
  let mockVectorStore: any;

  beforeEach(() => {
    mockMoodleClient = new MoodleClient();
    mockMemoryService = new MemoryService();
    mockVectorStore = new CustomVectorStore();

    // Setup mocks for the module imports
    vi.mocked(MoodleClient).mockImplementation(() => mockMoodleClient);
    vi.mocked(MemoryService).mockImplementation(() => mockMemoryService);
    vi.mocked(CustomVectorStore).mockImplementation(() => mockVectorStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("FetchForumPostsTool", () => {
    it("should have correct schema and name", () => {
      expect(FetchForumPostsTool.name).toBe("get_forum_posts");
      expect(FetchForumPostsTool.description).toContain("retrieve posts");
      expect(FetchForumPostsTool.schema.shape).toHaveProperty("discussionId");
    });

    it("should call MoodleClient.getForumPosts with correct parameters", async () => {
      mockMoodleClient.getForumPosts = vi.fn().mockResolvedValue({
        posts: [{ id: 1, subject: "Test post" }],
        forumid: 123,
        courseid: 456,
        warnings: [],
      });

      await FetchForumPostsTool.invoke({ discussionId: "123" });

      expect(mockMoodleClient.getForumPosts).toHaveBeenCalledWith("123");
    });
  });

  describe("GetRelevantKnowledge", () => {
    it("should have correct schema and name", () => {
      expect(GetRelevantKnowledge.name).toBe(
        "getRelevantKnowledgeFromMaterial"
      );
      expect(GetRelevantKnowledge.description).toContain(
        "recuperar informações relevantes"
      );
      expect(GetRelevantKnowledge.schema.shape).toHaveProperty("query");
    });

    it("should call vectorStore.searchSubjectKnowledge with query parameter", async () => {
      mockVectorStore.searchSubjectKnowledge.mockResolvedValue(
        "Knowledge content"
      );

      const result = await GetRelevantKnowledge.invoke({ query: "test query" });

      expect(mockVectorStore.searchSubjectKnowledge).toHaveBeenCalledWith(
        "test query"
      );
      expect(result).toBe("Knowledge content");
    });
  });

  describe("GetSubjectMetadata", () => {
    it("should have correct schema and name", () => {
      expect(GetSubjectMetadata.name).toBe("getSubjectMetadata");
      expect(GetSubjectMetadata.description).toContain(
        "recuperar informações do curso"
      );
      expect(GetSubjectMetadata.schema.shape).toHaveProperty("query");
    });

    it("should call vectorStore.searchSubjectMetadata with query parameter", async () => {
      mockVectorStore.searchSubjectMetadata.mockResolvedValue(
        "Metadata content"
      );

      const result = await GetSubjectMetadata.invoke({ query: "test query" });

      expect(mockVectorStore.searchSubjectMetadata).toHaveBeenCalledWith(
        "test query"
      );
      expect(result).toBe("Metadata content");
    });
  });

  describe("GetWeeklySummary", () => {
    it("should have correct schema and name", () => {
      expect(GetWeeklySummary.name).toBe("getWeeklySummary");
      expect(GetWeeklySummary.description).toContain(
        "retrieve a summary of actions"
      );
      expect(GetWeeklySummary.schema.shape).toHaveProperty("startDate");
      expect(GetWeeklySummary.schema.shape).toHaveProperty("endDate");
    });

    it("should call memoryService.summarizeActionsForDateRange with date parameters", async () => {
      const mockSummary = {
        weekOverview: "Test overview",
        keyActivities: [],
        assignmentsSummary: [],
        discussionsHighlights: [],
      };

      mockMemoryService.summarizeActionsForDateRange.mockResolvedValue(
        mockSummary
      );

      const result = await GetWeeklySummary.invoke({
        startDate: "2023-05-01",
        endDate: "2023-05-07",
      });

      expect(
        mockMemoryService.summarizeActionsForDateRange
      ).toHaveBeenCalledWith("2023-05-01", "2023-05-07");
      expect(result).toEqual(mockSummary);
    });
  });
});
