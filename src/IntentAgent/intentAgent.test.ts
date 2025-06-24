import axios from "axios";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntentAgent } from "./intentAgent";

vi.mock("axios");
vi.mock("fs");

describe("IntentAgent", () => {
  let intentAgent: IntentAgent;

  beforeEach(() => {
    intentAgent = new IntentAgent();

    // Mock fs.readFileSync
    vi.mocked(fs.readFileSync).mockReturnValue("Test prompt content" as any);

    // Mock axios.post
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        response: `{
          "userId": "123",
          "courseId": "456",
          "summarizedInput": "Uma pergunta sobre a data da prova",
          "forumId": "789",
          "postId": "012",
          "intent": "assignment_deadline_query",
          "source": "forum_post",
          "createdAt": "2023-05-01T12:00:00Z",
          "updatedAt": "2023-05-01T12:00:00Z"
        }`,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should classify intent correctly", async () => {
    const prompt = JSON.stringify({
      userId: 123,
      courseId: 456,
      inputText: "Quando será a prova final?",
      forumId: 789,
      postId: 12,
      source: "forum_post",
    });

    const result = await intentAgent.classifyIntent(prompt);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        model: "gemma3:4b",
        prompt: expect.stringContaining(prompt),
        stream: false,
      })
    );

    expect(result).toEqual({
      userId: "123",
      courseId: "456",
      summarizedInput: "Uma pergunta sobre a data da prova",
      forumId: "789",
      postId: "012",
      intent: "assignment_deadline_query",
      source: "forum_post",
      createdAt: "2023-05-01T12:00:00Z",
      updatedAt: "2023-05-01T12:00:00Z",
    });
  });

  it("should handle errors correctly", async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error("API error"));

    await expect(intentAgent.classifyIntent("test prompt")).rejects.toThrow(
      "API error"
    );
  });
});
