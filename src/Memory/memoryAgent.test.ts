import axios from "axios";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryAgent } from "./memoryAgent";

// Change from jest.mock to vi.mock
vi.mock("axios");
vi.mock("fs");

describe("MemoryAgent", () => {
  let memoryAgent: MemoryAgent;

  beforeEach(() => {
    memoryAgent = new MemoryAgent();

    // Mock fs.readFileSync - change to vi style mocking
    vi.mocked(fs.readFileSync).mockReturnValue("Test system prompt");

    // Mock axios.post
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        response: `\`\`\`json
        {
          "weekOverview": "Focused on module completion and project feedback",
          "keyActivities": [
            {
              "type": "forum",
              "title": "Project Discussion",
              "details": "Discussion on final project requirements"
            }
          ],
          "assignmentsSummary": [
            {
              "title": "Final Project",
              "deadline": "2023-05-15T23:59:59Z",
              "status": {
                "submitted": 15,
                "pending": 5
              }
            }
          ],
          "discussionsHighlights": [
            {
              "title": "Project Questions",
              "topPosts": [
                {
                  "author": "Student1",
                  "content": "Question about project scope",
                  "timeCreated": "2023-05-01T14:30:00Z"
                }
              ]
            }
          ]
        }
        \`\`\``,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Use vi.restoreAllMocks instead of jest.clearAllMocks
  });

  it("should initialize with system prompt", () => {
    expect(memoryAgent).toBeDefined();
    expect(memoryAgent["systemPrompt"]).toBe("Test system prompt");
  });

  it("should summarize correctly", async () => {
    const input = JSON.stringify({
      actionsSummary: [
        {
          actionToBeTaken: "create_forum_post",
          reason: "Student needs clarification",
          wasActionTaken: true,
          actionSuccessful: true,
          content: "Response to student question",
          metadata: {
            userId: "123",
            courseId: "456",
            forumId: "789",
            postId: "101",
            intent: "help_request",
            source: "forum_post",
          },
          createdAt: "2023-05-01T10:00:00Z",
          updatedAt: "2023-05-01T10:05:00Z",
        },
      ],
    });

    const result = await memoryAgent.summarize(input);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        model: "gemma3:4b",
        prompt: expect.stringContaining(input),
        stream: false,
      })
    );

    expect(result).toEqual({
      weekOverview: "Focused on module completion and project feedback",
      keyActivities: [
        {
          type: "forum",
          title: "Project Discussion",
          details: "Discussion on final project requirements",
        },
      ],
      assignmentsSummary: [
        {
          title: "Final Project",
          deadline: "2023-05-15T23:59:59Z",
          status: {
            submitted: 15,
            pending: 5,
          },
        },
      ],
      discussionsHighlights: [
        {
          title: "Project Questions",
          topPosts: [
            {
              author: "Student1",
              content: "Question about project scope",
              timeCreated: "2023-05-01T14:30:00Z",
            },
          ],
        },
      ],
    });
  });

  it("should handle errors correctly", async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error("API error"));

    await expect(memoryAgent.summarize("test")).rejects.toThrow("API error");
  });
});
