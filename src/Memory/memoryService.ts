import { ActionRepository } from "@/Actions/actionRepository";
import { MemoryAgent } from "./memoryAgent";

export class MemoryService {
  private memory: Map<string, any>;
  private actionRepository: ActionRepository;
  private memoryAgent: MemoryAgent;

  constructor() {
    this.memory = new Map();
    this.actionRepository = new ActionRepository();
    this.memoryAgent = new MemoryAgent();
  }

  /**
   * Fetches all actions taken within a given date range and summarizes them using the ProfessorAgent.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns A summary of the week's actions.
   */
  async summarizeActionsForDateRange(
    startDate: string,
    endDate: string
  ): Promise<WeeklySummary> {
    try {
      // Fetch actions from the repository
      const actions = await this.actionRepository.getActionsByDateRange(
        startDate,
        endDate
      );

      if (actions.length === 0) {
        return {
          weekOverview: "No actions taken this week.",
          keyActivities: [],
          assignmentsSummary: [],
          discussionsHighlights: [],
        };
      }

      /*      // Prepare data for the agent
      const summarizedInput = actions.map((action: any) => ({
        actionToBeTaken: action.actionToBeTaken,
        reason: action.reason,
        priority: action.priority,
        confidence: action.confidence,
        content: action.content,
        metadata: action.metadata,
      }));
 */
      // Call the MemoryAgent to summarize the actions
      const actionsFormatted: WeeklySummaryInput[] = actions.map(
        (action: any) => ({
          actionToBeTaken: action.actionToBeTaken,
          reason: action.reason,
          wasActionTaken: action.wasActionTaken, // Default value, can be updated based on logic
          actionSuccessful: action.actionSuccessful, // Default value, can be updated based on logic
          content: action.content,
          metadata: {
            userId: "system", // System-level summary
            courseId: "all", // All courses
            forumId: null,
            postId: null,
            intent: "summarize_week",
            source: "system",
          },
          createdAt: action.createdAt, // Current timestamp
          updatedAt: action.updatedAt, // Default value, can be updated based on logic
        })
      );

      const summary = await this.memoryAgent.summarize(
        JSON.stringify({
          actionsSummary: actionsFormatted,
        })
      );

      return summary;
    } catch (error) {
      console.error("Error summarizing actions for date range:", error);
      throw error;
    }
  }

  async getSubjectMetadata() {
    try {
      const subjectMetadata = await this.actionRepository.getSubjectMetadata();
      return subjectMetadata;
    } catch (error) {
      console.error("Error fetching subject metadata:", error);
      throw error;
    }
  }
}
