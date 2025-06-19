import dotenv from "dotenv";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionService } from "./Actions/actionService";
import { IntentAgent } from "./IntentAgent/intentAgent";
import { IntentClassifier } from "./IntentAgent/intentClassifier";
import { IntentRepository } from "./IntentAgent/intentRepository";
import { MoodleClient } from "./Moodle/moodleController";
import { ProactiveEngine } from "./ProactiveEngine";
import { ProfessorAgent } from "./ProfessorAgent/agent";
import { CustomVectorStore } from "./RAG/vectorStore";

// Mock all dependencies
vi.mock("dotenv");
vi.mock("./ProactiveEngine");
vi.mock("./Actions/actionService");
vi.mock("./IntentAgent/intentRepository");
vi.mock("./Moodle/moodleController");
vi.mock("./ProfessorAgent/agent");
vi.mock("./IntentAgent/intentClassifier");
vi.mock("./IntentAgent/intentAgent");
vi.mock("./RAG/vectorStore");
vi.mock("./Middleware/orchestrator", () => {
  return {
    Orchestrator: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock console.log and console.error to verify output
const consoleLogMock = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorMock = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Store the original process.exit function before mocking
const originalProcessExit = process.exit;

describe("Application Entry Point", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetModules();
    vi.clearAllMocks();

    // Mock process.exit to prevent tests from actually exiting
    process.exit = vi.fn() as any;

    // Set up environment mocks
    vi.mocked(dotenv.config).mockReturnValue({ parsed: {} });

    // Mock successful initialization for dependencies
    vi.mocked(CustomVectorStore.prototype.processPDFs).mockResolvedValue(
      undefined
    );
    vi.mocked(ProactiveEngine.prototype.run).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore the original process.exit after tests
    process.exit = originalProcessExit;
  });

  it("should initialize all required services", async () => {
    // Import the index module - this should trigger the initialization
    await import("./index");

    // Verify dotenv was configured
    expect(dotenv.config).toHaveBeenCalled();

    // Verify vector store was initialized and PDFs were processed
    expect(CustomVectorStore).toHaveBeenCalled();
    expect(CustomVectorStore.prototype.processPDFs).toHaveBeenCalled();

    // Verify core services were created
    expect(MoodleClient).toHaveBeenCalled();
    expect(IntentRepository).toHaveBeenCalled();
    expect(IntentAgent).toHaveBeenCalled();
    expect(IntentClassifier).toHaveBeenCalled();
    expect(ProfessorAgent).toHaveBeenCalled();
    expect(ActionService).toHaveBeenCalled();

    // Verify the proactive engine was started
    expect(ProactiveEngine).toHaveBeenCalled();
    expect(ProactiveEngine.prototype.run).toHaveBeenCalled();

    // Verify startup log message
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("Starting")
    );
  });

  it("should handle errors during initialization", async () => {
    // Mock a failure in processPDFs
    vi.mocked(CustomVectorStore.prototype.processPDFs).mockRejectedValue(
      new Error("Failed to process PDFs")
    );

    // Import the index module again - this should trigger the error handling
    await import("./index");

    // Verify error was logged
    expect(consoleErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("Error initializing application"),
      expect.any(Error)
    );

    // Verify process attempted to exit with error code
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("should handle errors during proactive engine startup", async () => {
    // Mock successful PDF processing but failure in engine startup
    vi.mocked(CustomVectorStore.prototype.processPDFs).mockResolvedValue(
      undefined
    );
    vi.mocked(ProactiveEngine.prototype.run).mockRejectedValue(
      new Error("Failed to start proactive engine")
    );

    // Import the index module again
    await import("./index");

    // Verify error was logged
    expect(consoleErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("Error initializing application"),
      expect.any(Error)
    );

    // Verify process attempted to exit with error code
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("should set up environment variables correctly", async () => {
    // Mock specific environment variables being loaded
    vi.mocked(dotenv.config).mockReturnValue({
      parsed: {
        MOODLE_BASE_URL: "http://test-moodle.com",
        MOODLE_TOKEN: "test-token",
        COURSE_ID: "123",
        CRON_FREQUENCY_MINUTES: "10",
      },
    });

    // Import the index module again
    await import("./index");

    // Verify environment variables were logged
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("Environment variables loaded")
    );

    // Verify services were initialized with the correct config
    // This would require more specific checks against the actual implementation
  });
});
