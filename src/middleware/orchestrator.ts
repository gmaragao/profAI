import { getPrismaClient } from "@/database/prismaService";
import { MoodleClient } from "@/Moodle/moodleController";
import MemoryRepository from "@/repository/memoryRepository";
import { IntentClassifier } from "./intentClassifier";

export interface OrchestratorInput {
  rawInput: any;
  sourceId?: string;
  userId?: string;
  courseId?: string;
  metadata?: Record<string, any>;
}

export interface ClassifiedInput extends OrchestratorInput {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}

export interface ContextualizedInput extends ClassifiedInput {
  context: {
    relevantMemories: any[];
    courseContext?: any;
    userContext?: any;
  };
}

export class Orchestrator {
  constructor(
    private intentClassifier: IntentClassifier,
    private memoryRepository: MemoryRepository,
    private moodleClient: MoodleClient,
    private prisma = getPrismaClient()
  ) {}

  getPrisma = async () => {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    // find all classified intents in the database
    const newIntent = await this.prisma.classifiedIntent.create({
      data: {
        userId: "123",
        courseId: "456",
        summarizedInput: "This is a test input",
        forumId: "789",
        postId: "101112",
        intent: "test_intent",
        source: "forum",
      },
    });

    console.log("Inserted record:", newIntent);
    console.log("Fetching classified intents from the database...");
    const classifiedIntents = await this.prisma.classifiedIntent.findMany();
    console.log("Classified intents fetched: ", classifiedIntents);
  };
  async getForumData() {
    const courseId = "3"; // Replace with the actual course ID
    const discussions = await this.moodleClient.getForumPosts(courseId);

    const classifiedPosts =
      await this.intentClassifier.classifyAndSummarizePosts(discussions);

    for (const post of classifiedPosts) {
      await this.prisma.classifiedIntent.create({
        data: {
          userId: post.userId,
          courseId: post.courseId,
          summarizedInput: post.summarizedInput,
          forumId: post.forumId,
          postId: post.postId,
          intent: post.intent,
          source: post.source,
        },
      });
    }
  }

  async getLatestKnownForumData() {
    const date = new Date(
      new Date().getTime() - 24 * 60 * 60 * 1000 // 24 hours ago
    ).toISOString();
    const newUpdates = await this.moodleClient.getUpdatesSince(date);

    console.log(newUpdates);
  }
}
