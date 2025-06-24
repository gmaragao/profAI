import {
  ClassifiedIntentFromAgent,
  IntentAgent,
} from "@/IntentAgent/intentAgent";
import { IntentClassifier } from "@/IntentAgent/intentClassifier";
import { IntentRepository } from "@/IntentAgent/intentRepository";
import { MoodleClient } from "@/Moodle/moodleClient";
import { ProfessorAgent } from "@/ProfessorAgent/agent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Orchestrator } from "./orchestrator";

// Mock dependencies
vi.mock("@/IntentAgent/intentRepository");
vi.mock("@/IntentAgent/intentClassifier");
vi.mock("@/Moodle/moodleController");
vi.mock("@/ProfessorAgent/agent");

describe("Orchestrator", () => {
  let orchestrator: Orchestrator;
  let mockIntentClassifier: any;
  let mockMoodleClient: any;
  let mockIntentRepository: any;
  let mockProfessorAgent: any;
  let mockIntentAgent: any;

  // Mock environment variable
  const originalEnv = process.env;

  beforeEach(() => {
    // Setup environment
    process.env.COURSE_ID = "123";

    // Create mock instances
    mockIntentAgent = new IntentAgent();
    mockIntentClassifier = new IntentClassifier(mockIntentAgent);
    mockMoodleClient = new MoodleClient();
    mockIntentRepository = new IntentRepository();
    mockProfessorAgent = new ProfessorAgent();

    // Mock methods
    mockIntentClassifier.classifyAndSummarizePost = vi.fn();
    mockMoodleClient.getForumPosts = vi.fn();
    mockMoodleClient.getUpdatesSince = vi.fn();
    mockIntentRepository.getLastClassifiedIntent = vi.fn();
    mockIntentRepository.saveClassifiedIntent = vi.fn();
    mockProfessorAgent.invoke = vi.fn();

    // Create orchestrator with mocked dependencies
    orchestrator = new Orchestrator(
      mockIntentClassifier,
      mockMoodleClient,
      mockIntentRepository,
      mockProfessorAgent
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnv;
  });

  describe("getForumData", () => {
    it("should fetch and classify forum posts", async () => {
      // Mock forum data
      const mockDiscussion = {
        posts: [
          {
            id: 101,
            subject: "Test Subject",
            message: "Test Message",
            author: { id: 201 },
            timecreated: 1622548800,
            timemodified: 1622548900,
          },
        ],
        forumid: 301,
        courseid: 123,
      };

      // Mock classified data
      const mockClassifiedPost: ClassifiedIntentFromAgent = {
        userId: "201",
        courseId: "123",
        summarizedInput: "Summarized Test Message",
        forumId: "301",
        postId: "101",
        intent: "question",
        source: "forum_post",
        createdAt: "1622548800",
        updatedAt: "1622548900",
      };

      // Setup mocks
      mockMoodleClient.getForumPosts.mockResolvedValue(mockDiscussion);
      mockIntentClassifier.classifyAndSummarizePost.mockResolvedValue(
        mockClassifiedPost
      );

      // Execute method
      await orchestrator.getForumData();

      // Verify calls
      expect(mockMoodleClient.getForumPosts).toHaveBeenCalledWith("123");
      expect(
        mockIntentClassifier.classifyAndSummarizePost
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 201,
          courseId: 123,
          inputText: "Test Message",
          forumId: 301,
          postId: 101,
          source: "forum_post",
          subject: "Test Subject",
          message: "Test Message",
        })
      );
      expect(mockIntentRepository.saveClassifiedIntent).toHaveBeenCalledWith(
        mockClassifiedPost
      );
    });

    it("should handle missing timemodified in posts", async () => {
      // Mock forum data without timemodified
      const mockDiscussion = {
        posts: [
          {
            id: 101,
            subject: "Test Subject",
            message: "Test Message",
            author: { id: 201 },
            timecreated: 1622548800,
            // No timemodified
          },
        ],
        forumid: 301,
        courseid: 123,
      };

      // Setup mocks
      mockMoodleClient.getForumPosts.mockResolvedValue(mockDiscussion);
      mockIntentClassifier.classifyAndSummarizePost.mockResolvedValue(
        {} as ClassifiedIntentFromAgent
      );

      // Execute method
      await orchestrator.getForumData();

      // Verify the post was processed with undefined updatedAt
      expect(
        mockIntentClassifier.classifyAndSummarizePost
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: undefined,
        })
      );
    });

    it("should handle errors when saving classified intent", async () => {
      // Mock console.error to verify it's called
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock forum data
      const mockDiscussion = {
        posts: [
          {
            id: 101,
            subject: "Test",
            message: "Test",
            author: { id: 201 },
            timecreated: 1622548800,
          },
        ],
        forumid: 301,
        courseid: 123,
      };

      // Setup mocks
      mockMoodleClient.getForumPosts.mockResolvedValue(mockDiscussion);
      mockIntentClassifier.classifyAndSummarizePost.mockResolvedValue(
        {} as ClassifiedIntentFromAgent
      );
      mockIntentRepository.saveClassifiedIntent.mockRejectedValue(
        new Error("Database error")
      );

      // Execute method - should not throw
      await expect(orchestrator.getForumData()).resolves.not.toThrow();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving classified intent:",
        expect.any(Error)
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getUpdatesAndClassify", () => {
    it("should fetch and classify updates since last intent", async () => {
      // Mock last classified intent
      const lastIntent = {
        createdAt: new Date("2023-01-01T12:00:00Z"),
      };

      // Mock updates
      const mockUpdates = [
        {
          id: 101,
          subject: "New Post",
          content: "New Content",
          authorId: 201,
          moduleId: 301,
          typeName: "forum",
          createdAt: "2023-01-02T12:00:00Z",
          updatedAt: "2023-01-02T12:05:00Z",
        },
      ];

      // Mock classified data
      const mockClassifiedIntent: ClassifiedIntentFromAgent = {
        userId: "201",
        courseId: "123",
        summarizedInput: "Summarized New Content",
        forumId: "301",
        postId: "101",
        intent: "question",
        source: "forum",
        createdAt: "2023-01-02T12:00:00Z",
        updatedAt: "2023-01-02T12:05:00Z",
      };

      // Setup mocks
      mockIntentRepository.getLastClassifiedIntent.mockResolvedValue(
        lastIntent
      );
      mockMoodleClient.getUpdatesSince.mockResolvedValue(mockUpdates);
      mockIntentClassifier.classifyAndSummarizePost.mockResolvedValue(
        mockClassifiedIntent
      );

      // Execute method
      const result = await orchestrator.getUpdatesAndClassify();

      // Verify calls with correct timestamp (+1 minute from last intent)
      const expectedTimestamp = Math.floor(
        new Date("2023-01-01T12:01:00Z").getTime() / 1000
      );
      expect(mockMoodleClient.getUpdatesSince).toHaveBeenCalledWith(
        123,
        expectedTimestamp
      );

      // Verify classification was called with correct data
      expect(
        mockIntentClassifier.classifyAndSummarizePost
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 201,
          courseId: 123,
          forumId: 301,
          postId: 101,
        })
      );

      // Verify result
      expect(result).toEqual([mockClassifiedIntent]);
      expect(mockIntentRepository.saveClassifiedIntent).toHaveBeenCalledWith(
        mockClassifiedIntent
      );
    });

    it("should use default date when no last intent exists", async () => {
      // Mock no last intent
      mockIntentRepository.getLastClassifiedIntent.mockResolvedValue(null);
      mockMoodleClient.getUpdatesSince.mockResolvedValue([]);

      // Setup Date.now mock to return a fixed timestamp
      const realDateNow = Date.now;
      const mockNow = new Date().getTime();
      global.Date.now = vi.fn(() => mockNow);

      // Execute method
      await orchestrator.getUpdatesAndClassify();

      // Verify call with 24 hours ago timestamp
      const expectedTimestamp = Math.floor(
        (mockNow - 24 * 60 * 60 * 1000) / 1000
      );
      expect(mockMoodleClient.getUpdatesSince).toHaveBeenCalledWith(
        123,
        expectedTimestamp
      );

      // Restore Date.now
      global.Date.now = realDateNow;
    });

    it("should throw error if COURSE_ID is not set", async () => {
      // Unset COURSE_ID
      delete process.env.COURSE_ID;

      // Verify it throws
      await expect(orchestrator.getUpdatesAndClassify()).rejects.toThrow(
        "COURSE_ID environment variable is not set"
      );
    });

    it("should handle errors when saving classified intents", async () => {
      // Mock console.error
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock data
      mockIntentRepository.getLastClassifiedIntent.mockResolvedValue(null);
      mockMoodleClient.getUpdatesSince.mockResolvedValue([
        {
          id: 101,
          subject: "Test",
          content: "Test",
          authorId: 201,
          moduleId: 301,
          typeName: "forum",
          createdAt: "2023-01-01T12:00:00Z",
        },
      ]);
      mockIntentClassifier.classifyAndSummarizePost.mockResolvedValue(
        {} as ClassifiedIntentFromAgent
      );
      mockIntentRepository.saveClassifiedIntent.mockRejectedValue(
        new Error("Database error")
      );

      // Execute method - should not throw
      const result = await orchestrator.getUpdatesAndClassify();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving classified intent:",
        expect.any(Error)
      );

      // Result should still contain the classified intent
      expect(result).toHaveLength(1);

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getActionToBeTaken", () => {
    it("should invoke professor agent with classified intent", async () => {
      // Mock data
      const mockClassifiedIntent: ClassifiedIntentFromAgent = {
        userId: "201",
        courseId: "123",
        summarizedInput: "Question about deadline",
        forumId: "301",
        postId: "101",
        intent: "deadline_query",
        source: "forum_post",
        createdAt: "2023-01-01T12:00:00Z",
        updatedAt: "2023-01-01T12:05:00Z",
      };

      const mockAction = {
        actionToBeTaken: "create_forum_post",
        reason: "Student needs help with deadline",
        priority: 0.8,
        confidence: 0.9,
        content: "The deadline is January 15th",
      };

      // Setup mock
      mockProfessorAgent.invoke.mockResolvedValue(mockAction);

      // Execute method
      const result = await orchestrator.getActionToBeTaken(
        mockClassifiedIntent
      );

      // Verify professor agent was called with the intent
      expect(mockProfessorAgent.invoke).toHaveBeenCalledWith(
        mockClassifiedIntent
      );

      // Verify result
      expect(result).toEqual(mockAction);
    });

    it("should log when getting actions", async () => {
      // Mock console.log
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      // Mock data
      const mockClassifiedIntent = {} as ClassifiedIntentFromAgent;
      mockProfessorAgent.invoke.mockResolvedValue({});

      // Execute method
      await orchestrator.getActionToBeTaken(mockClassifiedIntent);

      // Verify log
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Getting actions to be taken..."
      );

      // Restore console.log
      consoleLogSpy.mockRestore();
    });
  });
});
