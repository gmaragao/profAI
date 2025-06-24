import { ClassifiedIntent, PrismaClient } from "@/generated/prisma";
import { ClassifiedIntentFromAgent } from "./intentAgent";

export class IntentRepository {
  async getLastClassifiedIntent(): Promise<ClassifiedIntent | null> {
    return await this.prisma.classifiedIntent.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });
  }
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async saveClassifiedIntent(
    classifiedPost: ClassifiedIntentFromAgent
  ): Promise<ClassifiedIntent> {
    return await this.prisma.classifiedIntent.create({
      data: {
        userId: classifiedPost.userId,
        courseId: classifiedPost.courseId,
        summarizedInput: classifiedPost.summarizedInput,
        forumId: classifiedPost.forumId,
        postId: classifiedPost.postId,
        intent: classifiedPost.intent,
        source: classifiedPost.source,
        externalCreatedAt: new Date(classifiedPost.createdAt).toISOString(),
        externalUpdatedAt: classifiedPost.updatedAt
          ? new Date(classifiedPost.createdAt).toISOString()
          : null,
      },
    });
  }

  async getClassifiedIntents(): Promise<ClassifiedIntent[]> {
    return await this.prisma.classifiedIntent.findMany();
  }
}
