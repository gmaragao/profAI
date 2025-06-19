import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryService } from "./memoryService";

// Mock dependencies
vi.mock("@/Actions/actionRepository");
vi.mock("./memoryAgent");

describe("MemoryService", () => {
  let memoryService: MemoryService;
  let mockActionRepository: any;
  let mockMemoryAgent: any;

  beforeEach(() => {
    memoryService = new MemoryService();
    mockActionRepository = (memoryService as any).actionRepository;
    mockMemoryAgent = (memoryService as any).memoryAgent;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("summarizeActionsForDateRange", () => {
    it("should return default summary when no actions found", async () => {
      mockActionRepository.getActionsByDateRange = vi
        .fn()
        .mockResolvedValue([]);

      const result = await memoryService.summarizeActionsForDateRange(
        "2023-05-01",
        "2023-05-07"
      );

      expect(mockActionRepository.getActionsByDateRange).toHaveBeenCalledWith(
        "2023-05-01",
        "2023-05-07"
      );
      expect(result).toEqual({
        weekOverview: "No actions taken this week.",
        keyActivities: [],
        assignmentsSummary: [],
        discussionsHighlights: [],
      });
      expect(mockMemoryAgent.summarize).not.toHaveBeenCalled();
    });

    it("should summarize actions correctly", async () => {
      const mockActions = [
        {
          id: "123",
          actionToBeTaken: "create_forum_post",
          reason: "Student needs help",
          priority: 0.8,
          confidence: 0.9,
          content: "Response to help request",
          metadata: {
            userId: "456",
            courseId: "789",
            forumId: "101",
            postId: "102",
            intent: "help_request",
            source: "forum_post",
          },
          memorySummary: "Help provided to student",
          wasActionTaken: true,
          actionSuccessful: true,
          createdAt: new Date("2023-05-01T10:00:00Z"),
          updatedAt: new Date("2023-05-01T10:05:00Z"),
        },
      ];

      const mockSummary = {
        weekOverview: "Focused on helping students",
        keyActivities: [
          {
            type: "forum",
            title: "Help Request Response",
            details: "Responded to student question",
          },
        ],
        assignmentsSummary: [],
        discussionsHighlights: [
          {
            title: "Help Discussion",
            topPosts: [
              {
                author: "Professor",
                content: "Response to help request",
                timeCreated: "2023-05-01T10:05:00Z",
              },
            ],
          },
        ],
      };

      mockActionRepository.getActionsByDateRange = vi
        .fn()
        .mockResolvedValue(mockActions);
      mockMemoryAgent.summarize = vi.fn().mockResolvedValue(mockSummary);

      const result = await memoryService.summarizeActionsForDateRange(
        "2023-05-01",
        "2023-05-07"
      );

      expect(mockActionRepository.getActionsByDateRange).toHaveBeenCalledWith(
        "2023-05-01",
        "2023-05-07"
      );
      expect(mockMemoryAgent.summarize).toHaveBeenCalledWith(
        expect.stringContaining('"actionToBeTaken":"create_forum_post"')
      );
      expect(result).toEqual(mockSummary);
    });

    it("should handle errors from action repository", async () => {
      mockActionRepository.getActionsByDateRange = vi
        .fn()
        .mockRejectedValue(new Error("Repository error"));

      await expect(
        memoryService.summarizeActionsForDateRange("2023-05-01", "2023-05-07")
      ).rejects.toThrow("Repository error");
    });

    it("should handle errors from memory agent", async () => {
      const mockActions = [
        {
          id: "123",
          actionToBeTaken: "create_forum_post",
          reason: "Test reason",
          priority: 0.8,
          confidence: 0.9,
          content: "Test content",
          metadata: {
            userId: "123",
            courseId: "456",
            forumId: "789",
            postId: "101",
            intent: "test",
            source: "forum",
          },
          memorySummary: "Test summary",
          wasActionTaken: true,
          actionSuccessful: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockActionRepository.getActionsByDateRange = vi
        .fn()
        .mockResolvedValue(mockActions);
      mockMemoryAgent.summarize = vi
        .fn()
        .mockRejectedValue(new Error("Agent error"));

      await expect(
        memoryService.summarizeActionsForDateRange("2023-05-01", "2023-05-07")
      ).rejects.toThrow("Agent error");
    });
  });

  describe("getSubjectMetadata", () => {
    it("should return subject metadata", async () => {
      const mockMetadata = {
        title: "Test Subject",
        description: "Test Description",
      };
      mockActionRepository.getSubjectMetadata = vi
        .fn()
        .mockResolvedValue(mockMetadata);

      const result = await memoryService.getSubjectMetadata();

      expect(mockActionRepository.getSubjectMetadata).toHaveBeenCalled();
      expect(result).toEqual(mockMetadata);
    });

    it("should handle errors", async () => {
      mockActionRepository.getSubjectMetadata = vi
        .fn()
        .mockRejectedValue(new Error("Metadata error"));

      await expect(memoryService.getSubjectMetadata()).rejects.toThrow(
        "Metadata error"
      );
    });
  });
});
