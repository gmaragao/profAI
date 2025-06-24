import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClassifiedIntentFromAgent, IntentAgent } from "./intentAgent";
import { ClassifierInput, IntentClassifier } from "./intentClassifier";

vi.mock("./intentAgent");

describe("IntentClassifier", () => {
  let intentClassifier: IntentClassifier;
  let mockIntentAgent: any;

  beforeEach(() => {
    mockIntentAgent = new IntentAgent();
    intentClassifier = new IntentClassifier(mockIntentAgent);
  });

  it("should classify and summarize posts correctly", async () => {
    const input: ClassifierInput = {
      userId: 123,
      courseId: 456,
      inputText: "Quando será a prova final?",
      forumId: 789,
      postId: 12,
      source: "forum_post",
      subject: "Prova Final",
      message: "Quando será a prova final?",
      createdAt: "2023-05-01T12:00:00Z",
      updatedAt: "2023-05-01T12:00:00Z",
    };

    const expectedOutput: ClassifiedIntentFromAgent = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Pergunta sobre data da prova final",
      forumId: "789",
      postId: "12",
      intent: "assignment_deadline_query",
      source: "forum_post",
      createdAt: "2023-05-01T12:00:00Z",
      updatedAt: "2023-05-01T12:00:00Z",
    };

    mockIntentAgent.classifyIntent = vi.fn().mockResolvedValue(expectedOutput);

    const result = await intentClassifier.classifyAndSummarizePost(input);

    expect(mockIntentAgent.classifyIntent).toHaveBeenCalledWith(
      JSON.stringify(input)
    );
    expect(result).toEqual(expectedOutput);
  });

  it("should handle errors from intent agent", async () => {
    const input: ClassifierInput = {
      userId: 123,
      courseId: 456,
      inputText: "Quando será a prova final?",
      forumId: 789,
      postId: 12,
      source: "forum_post",
      createdAt: "2023-05-01T12:00:00Z",
    };

    mockIntentAgent.classifyIntent = vi
      .fn()
      .mockRejectedValue(new Error("Classification error"));

    await expect(
      intentClassifier.classifyAndSummarizePost(input)
    ).rejects.toThrow("Classification error");
  });
});
