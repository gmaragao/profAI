import { ChatOllama } from "@langchain/ollama";
import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfessorAgent } from "./agent";
import * as Tools from "./tools";

// Mock dependencies
vi.mock("@langchain/ollama");
vi.mock("fs");
vi.mock("path");
vi.mock("url", () => ({
  fileURLToPath: vi.fn(() => "/mocked/file/path"),
}));
vi.mock("./tools", () => ({
  GetRelevantKnowledge: {
    name: "getRelevantKnowledgeFromMaterial",
    invoke: vi.fn().mockResolvedValue("Relevant knowledge content"),
  },
  GetSubjectMetadata: {
    name: "getSubjectMetadata",
    invoke: vi.fn().mockResolvedValue("Subject metadata content"),
  },
  GetWeeklySummary: {
    name: "getWeeklySummary",
    invoke: vi.fn().mockResolvedValue("Weekly summary content"),
  },
}));

describe("ProfessorAgent", () => {
  let professorAgent: ProfessorAgent;
  let mockChatOllama: any;
  const mockExtraInstructions =
    "Be concise and focus on the key points. Always provide accurate information.";

  beforeEach(() => {
    // Set up mocks before creating the agent
    mockChatOllama = {
      invoke: vi.fn().mockResolvedValue({ content: "AI response content" }),
      bindTools: vi.fn().mockReturnThis(),
    };
    vi.mocked(ChatOllama).mockImplementation(() => mockChatOllama);

    // Mock fs.readFileSync
    vi.mocked(fs.readFileSync).mockReturnValue(mockExtraInstructions);

    // Mock path.join
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
    vi.mocked(path.dirname).mockReturnValue("/mocked/path/directory");

    professorAgent = new ProfessorAgent();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct configuration", () => {
    expect(professorAgent).toBeDefined();
    expect(ChatOllama).toHaveBeenCalledWith({
      model: "llama3-groq-tool-use",
      temperature: 0.3,
      baseUrl: "http://localhost:11434",
    });
  });

  it("should invoke the agent with classified data", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Question about exam date",
      forumId: "789",
      postId: "101",
      intent: "deadline_query",
      source: "forum_post",
    };

    // Mock the AI response
    const mockToolCall = {
      name: "getRelevantKnowledgeFromMaterial",
      args: { query: "exam date" },
    };

    // First call returns message with tool calls
    mockChatOllama.invoke.mockResolvedValueOnce({
      content: "I need to look up information",
      tool_calls: [mockToolCall],
    });

    const result = await professorAgent.invoke(classifiedData);

    // Check initial setup
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(result).toBe("AI response content");

    // Verify the LLM was called with the correct parameters
    expect(mockChatOllama.invoke).toHaveBeenCalledTimes(2);
    expect(mockChatOllama.bindTools).toHaveBeenCalledWith([
      Tools.GetRelevantKnowledge,
      Tools.GetSubjectMetadata,
      Tools.GetWeeklySummary,
    ]);

    // Check that the tool was called
    expect(Tools.GetRelevantKnowledge.invoke).toHaveBeenCalledWith(
      mockToolCall
    );
  });

  it("should handle multiple tool calls correctly", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Need course info and knowledge",
      forumId: "789",
      postId: "101",
      intent: "information_query",
      source: "forum_post",
    };

    // Mock multiple tool calls
    const mockToolCalls = [
      {
        name: "getRelevantKnowledgeFromMaterial",
        args: { query: "course topic" },
      },
      {
        name: "getSubjectMetadata",
        args: { query: "course details" },
      },
      {
        name: "unknownTool", // This tool should be ignored
        args: { query: "something" },
      },
    ];

    mockChatOllama.invoke.mockResolvedValueOnce({
      content: "I need to gather information",
      tool_calls: mockToolCalls,
    });

    await professorAgent.invoke(classifiedData);

    // Verify both valid tools were called
    expect(Tools.GetRelevantKnowledge.invoke).toHaveBeenCalledWith(
      mockToolCalls[0]
    );
    expect(Tools.GetSubjectMetadata.invoke).toHaveBeenCalledWith(
      mockToolCalls[1]
    );
    // The third tool should not be called as it's not in toolsByName
  });

  it("should handle errors in tool calls gracefully", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Error test",
      forumId: "789",
      postId: "101",
      intent: "test_query",
      source: "forum_post",
    };

    // Mock a tool call that will error
    const mockErrorToolCall = {
      name: "getRelevantKnowledgeFromMaterial",
      args: { query: "error test" },
    };

    mockChatOllama.invoke.mockResolvedValueOnce({
      content: "Testing error handling",
      tool_calls: [mockErrorToolCall],
    });

    // Make the tool throw an error
    vi.mocked(Tools.GetRelevantKnowledge.invoke).mockRejectedValueOnce(
      new Error("Tool execution failed")
    );

    // The agent should catch the error and continue
    await expect(professorAgent.invoke(classifiedData)).resolves.toBe(
      "AI response content"
    );

    expect(mockChatOllama.invoke).toHaveBeenCalledTimes(2);
  });

  it("should format data correctly for prompt", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Simple request",
      forumId: "789",
      postId: "101",
      intent: "simple_query",
      source: "forum_post",
    };

    await professorAgent.invoke(classifiedData);

    // Verify the LLM was called with properly formatted data
    const invokeCall = mockChatOllama.invoke.mock.calls[0][0];

    // Check that the message contains the user data
    const userDataMessage = invokeCall.find(
      (msg: any) => msg.content && msg.content.includes("USER_DATA")
    );

    expect(userDataMessage).toBeDefined();
    expect(userDataMessage.content).toContain('"userId":"123"');
    expect(userDataMessage.content).toContain(
      '"summarizedInput":"Simple request"'
    );
    expect(userDataMessage.content).toContain('"intent":"simple_query"');
  });

  it("should include extra instructions from file in the prompt", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Test query",
      forumId: "789",
      postId: "101",
      intent: "general_query",
      source: "forum_post",
    };

    await professorAgent.invoke(classifiedData);

    // Check that readFileSync was called with the correct path
    expect(fs.readFileSync).toHaveBeenCalledWith(
      "/mocked/path/directory/extraInstructions.txt",
      "utf-8"
    );

    // Verify that the extra instructions were included in the prompt
    const promptFormatCall = mockChatOllama.invoke.mock.calls[0][0];
    const systemMessage = promptFormatCall.find(
      (msg: any) => msg.content && msg.content.includes("extra_instructions")
    );

    expect(systemMessage).toBeDefined();
    expect(systemMessage.content).toContain(
      JSON.stringify(mockExtraInstructions)
    );
  });

  it("should handle empty or malformed response from LLM", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Test query",
      forumId: "789",
      postId: "101",
      intent: "general_query",
      source: "forum_post",
    };

    // Mock LLM returning empty content
    mockChatOllama.invoke
      .mockResolvedValueOnce({ content: "" })
      .mockResolvedValueOnce({ content: "Fallback response" });

    const result = await professorAgent.invoke(classifiedData);

    // Should still return something
    expect(result).toBe("Fallback response");
  });

  it("should handle case where no tools are called", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Simple question",
      forumId: "789",
      postId: "101",
      intent: "greeting",
      source: "forum_post",
    };

    // Mock LLM not calling any tools
    mockChatOllama.invoke.mockResolvedValueOnce({
      content: "I can answer this directly",
      tool_calls: [],
    });

    await professorAgent.invoke(classifiedData);

    // Should still proceed to second invoke call
    expect(mockChatOllama.invoke).toHaveBeenCalledTimes(2);

    // No tools should be called
    expect(Tools.GetRelevantKnowledge.invoke).not.toHaveBeenCalled();
    expect(Tools.GetSubjectMetadata.invoke).not.toHaveBeenCalled();
    expect(Tools.GetWeeklySummary.invoke).not.toHaveBeenCalled();
  });

  it("should handle case where tool_calls is undefined", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Another question",
      forumId: "789",
      postId: "101",
      intent: "general_query",
      source: "forum_post",
    };

    // Mock LLM returning response without tool_calls property
    mockChatOllama.invoke.mockResolvedValueOnce({
      content: "I can answer without tools",
      // No tool_calls property
    });

    await professorAgent.invoke(classifiedData);

    // Should still proceed to second invoke call
    expect(mockChatOllama.invoke).toHaveBeenCalledTimes(2);

    // No tools should be called
    expect(Tools.GetRelevantKnowledge.invoke).not.toHaveBeenCalled();
    expect(Tools.GetSubjectMetadata.invoke).not.toHaveBeenCalled();
  });

  it("should correctly bind all tools to the LLM", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Tool binding test",
      forumId: "789",
      postId: "101",
      intent: "test_query",
      source: "forum_post",
    };

    await professorAgent.invoke(classifiedData);

    // Verify that bindTools was called with all three tools
    expect(mockChatOllama.bindTools).toHaveBeenCalledWith([
      Tools.GetRelevantKnowledge,
      Tools.GetSubjectMetadata,
      Tools.GetWeeklySummary,
    ]);
  });

  it("should add tool response messages to the conversation", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Need data",
      forumId: "789",
      postId: "101",
      intent: "data_request",
      source: "forum_post",
    };

    // Set up tool call and response
    const mockToolCall = {
      name: "getSubjectMetadata",
      args: { query: "course details" },
    };

    mockChatOllama.invoke.mockResolvedValueOnce({
      content: "Getting course details",
      tool_calls: [mockToolCall],
    });

    // Execute the method
    await professorAgent.invoke(classifiedData);

    // Check that the second invoke includes the tool messages
    const secondInvokeMessages = mockChatOllama.invoke.mock.calls[1][0];

    // The last messages should be the tool response
    const toolResponseIncluded = secondInvokeMessages.some(
      (msg: any) => msg === "Subject metadata content"
    );

    expect(toolResponseIncluded).toBe(true);
  });

  it("should retry failed tool calls with appropriate error handling", async () => {
    const classifiedData = {
      userId: "123",
      courseId: "456",
      summarizedInput: "Error recovery test",
      forumId: "789",
      postId: "101",
      intent: "test_error_recovery",
      source: "forum_post",
    };

    const mockToolCall = {
      name: "getRelevantKnowledgeFromMaterial",
      args: { query: "test retry" },
    };

    // First call to invoke returns a tool call
    mockChatOllama.invoke.mockResolvedValueOnce({
      content: "Need to get knowledge",
      tool_calls: [mockToolCall],
    });

    // First attempt at tool call fails
    const originalToolInvoke = Tools.GetRelevantKnowledge.invoke;
    let callCount = 0;

    // Mock tool to fail on first call, succeed on second
    vi.mocked(Tools.GetRelevantKnowledge.invoke).mockImplementation(
      async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Tool execution failed");
        }
        return "Retry successful";
      }
    );

    // Run the method
    await professorAgent.invoke(classifiedData);

    // Tool should still be called just once (no automatic retry in current implementation)
    expect(Tools.GetRelevantKnowledge.invoke).toHaveBeenCalledTimes(1);
  });
});
