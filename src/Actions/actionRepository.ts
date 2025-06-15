import { getPrismaClient } from "@/database/prismaService";
import {} from "@/Middleware/types";
import { ProfessorAgentAction } from "@/ProfessorAgent/models/action";
import { PrismaClient } from "@prisma/client";

export class ActionRepository {
  private prisma: PrismaClient;
  constructor() {
    this.prisma = getPrismaClient();
  }

  async saveAction(action: ProfessorAgentAction) {
    try {
      return await this.prisma.action.create({
        data: {
          actionToBeTaken: action.actionToBeTaken,
          reason: action.reason,
          priority: action.priority,
          confidence: action.confidence,
          content: action.content,
          metadata: action.metadata,
          memorySummary: action.memorySummary ? action.memorySummary : "",
          wasActionTaken: false,
          actionSuccessful: null,
          createdAt: new Date(),
          updatedAt: null,
        },
      });
    } catch (error) {
      console.error("Error saving action:", error);
      throw new Error("Failed to save action");
    }
  }

  async updateAction(
    actionId: string,
    wasActionTaken: boolean,
    actionSuccessful: boolean | null,
    updatedAt: Date
  ) {
    return await this.prisma.action.update({
      where: { id: actionId },
      data: {
        wasActionTaken,
        actionSuccessful,
        updatedAt,
      },
    });
  }

  /**
   * Fetches all actions taken within a given date range.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns A list of actions taken within the date range.
   */
  async getActionsByDateRange(startDate: string, endDate: string) {
    return this.prisma.action.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
  }
}
