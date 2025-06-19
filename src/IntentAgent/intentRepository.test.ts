import { ClassifiedIntent } from "@/generated/prisma";
import { ClassifiedIntentFromAgent } from "@/Middleware/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IntentRepository } from "./intentRepository";

// Mock PrismaClient
vi.mock("@/generated/prisma", () => {
  const mockCreate = vi.fn();
  const mockFindFirst = vi.fn();
  const mockFindMany = vi.fn();

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      classifiedIntent: {
        create: mockCreate,
        findFirst: mockFindFirst,
        findMany: mockFindMany,
      },
    })),
  };
});

describe("IntentRepository", () => {
  let intentRepository: IntentRepository;
  let mockPrismaClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    intentRepository = new IntentRepository();
    mockPrismaClient = (intentRepository as any).prisma;
  });

  it("should get last classified intent", async () => {
    const mockIntent: ClassifiedIntent = {
      id: "123",
      userId: "456",
      courseId: "789",
      summarizedInput: "Test query",
      forumId: "101",
      postId: "102",
      intent: "test_intent",
      source: "forum_post",
      createdAt: new Date(),
      updatedAt: new Date(),
      externalCreatedAt: new Date(),
      externalUpdatedAt: null,
    };

    mockPrismaClient.classifiedIntent.findFirst.mockResolvedValue(mockIntent);

    const result = await intentRepository.getLastClassifiedIntent();

    expect(mockPrismaClient.classifiedIntent.findFirst).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual(mockIntent);
  });

  it("should save classified intent", async () => {
    const mockPost: ClassifiedIntentFromAgent = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Test summary",
      forumId: "789",
      postId: "101",
      intent: "test_intent",
      source: "forum_post",
      createdAt: "2023-05-01T12:00:00Z",
      updatedAt: "2023-05-01T12:00:00Z",
    };

    const mockSavedIntent: ClassifiedIntent = {
      id: "999",
      userId: "123",
      courseId: "456",
      summarizedInput: "Test summary",
      forumId: "789",
      postId: "101",
      intent: "test_intent",
      source: "forum_post",
      createdAt: new Date(),
      updatedAt: new Date(),
      externalCreatedAt: new Date("2023-05-01T12:00:00Z"),
      externalUpdatedAt: new Date("2023-05-01T12:00:00Z"),
    };

    mockPrismaClient.classifiedIntent.create.mockResolvedValue(mockSavedIntent);

    const result = await intentRepository.saveClassifiedIntent(mockPost);

    expect(mockPrismaClient.classifiedIntent.create).toHaveBeenCalledWith({
      data: {
        userId: "123",
        courseId: "456",
        summarizedInput: "Test summary",
        forumId: "789",
        postId: "101",
        intent: "test_intent",
        source: "forum_post",
        externalCreatedAt: expect.any(String),
        externalUpdatedAt: expect.any(String),
      },
    });
    expect(result).toEqual(mockSavedIntent);
  });

  it("should get all classified intents", async () => {
    const mockIntents: ClassifiedIntent[] = [
      {
        id: "123",
        userId: "456",
        courseId: "789",
        summarizedInput: "Test query 1",
        forumId: "101",
        postId: "102",
        intent: "test_intent",
        source: "forum_post",
        createdAt: new Date(),
        updatedAt: new Date(),
        externalCreatedAt: new Date(),
        externalUpdatedAt: null,
      },
      {
        id: "124",
        userId: "456",
        courseId: "789",
        summarizedInput: "Test query 2",
        forumId: "101",
        postId: "103",
        intent: "test_intent",
        source: "forum_post",
        createdAt: new Date(),
        updatedAt: new Date(),
        externalCreatedAt: new Date(),
        externalUpdatedAt: null,
      },
    ];

    mockPrismaClient.classifiedIntent.findMany.mockResolvedValue(mockIntents);

    const result = await intentRepository.getClassifiedIntents();

    expect(mockPrismaClient.classifiedIntent.findMany).toHaveBeenCalled();
    expect(result).toEqual(mockIntents);
  });
});
