import { ActionRepository } from "@/Actions/actionRepository";
import { ClassifiedIntentFromAgent } from "@/IntentAgent/intentAgent";
import { IntentRepository } from "@/IntentAgent/intentRepository";
import { MoodleClient } from "@/moodle/moodleClient";
import { ProfessorAgent } from "@/ProfessorAgent/agent";
import { ProfessorAgentAction } from "@/ProfessorAgent/models/action";
import {
  ClassifierInput,
  IntentClassifier,
} from "../IntentAgent/intentClassifier";

interface OrchestratorInput {
  rawInput: any;
  sourceId?: string;
  userId?: string;
  courseId?: string;
  metadata?: Record<string, any>;
}

interface ClassifiedInput extends OrchestratorInput {
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
    private moodleClient: MoodleClient,
    private intentRepository: IntentRepository = new IntentRepository(),
    private professorAgent = new ProfessorAgent(),
    private actionRepository = new ActionRepository()
  ) {}

  async getForumData() {
    const courseId = process.env.COURSE_ID || "3";
    const discussion = await this.moodleClient.getForumPosts(courseId);

    for (const post of discussion.posts) {
      const formattedPost: ClassifierInput = {
        userId: post.author.id,
        courseId: discussion.courseid,
        inputText: post.message,
        forumId: discussion.forumid, // TODO -> Figure out why forum id and post id are the same
        postId: post.id,
        source: "forum_post",
        subject: post.subject,
        message: post.message,
        createdAt: post.timecreated.toString(),
        updatedAt: post.timemodified?.toString(), // Use modified date if available, otherwise use created date
      };

      const classifiedPost =
        await this.intentClassifier.classifyAndSummarizePost(formattedPost);

      try {
        await this.intentRepository.saveClassifiedIntent(classifiedPost);
      } catch (error) {
        console.error("Error saving classified intent:", error);
      }
    }
  }

  async getUpdatesAndClassify(): Promise<ClassifiedIntentFromAgent[]> {
    const classifiedUpdates: ClassifiedIntentFromAgent[] = [];

    // Get last intent classified from the database
    const lastIntent = await this.intentRepository.getLastClassifiedIntent();
    var sinceDate;
    if (lastIntent) {
      console.log("Last classified intent date: ", lastIntent.createdAt);
      sinceDate = new Date(lastIntent?.createdAt);
      sinceDate.setMinutes(sinceDate.getMinutes() + 1); // Add one minute to avoid fetching the same post again
    } else {
      sinceDate = new Date(
        new Date().getTime() - 24 * 60 * 60 * 1000 // 24 hours ago
      );
    }
    console.log("Retrieving updates since: ", sinceDate);
    const sinceDateEpochSeconds = Math.floor(sinceDate.getTime() / 1000);

    let courseId: any = process.env.COURSE_ID;
    if (!courseId) {
      throw new Error("COURSE_ID environment variable is not set");
    } else {
      courseId = parseInt(courseId);
    }

    const newUpdates = await this.moodleClient.getUpdatesSince(
      courseId,
      sinceDateEpochSeconds
    );
    console.log("New updates retrieved: ", newUpdates.length);

    for (const update of newUpdates) {
      const formattedUpdate: ClassifierInput = {
        userId: update.authorId,
        courseId: courseId,
        inputText: update.content,
        forumId: update.moduleId,
        postId: update.id,
        source: update.typeName,
        subject: update.subject,
        message: update.content,
        createdAt: update.createdAt,
        updatedAt: update.updatedAt,
      };

      const classifiedPost =
        await this.intentClassifier.classifyAndSummarizePost(formattedUpdate);
      console.log("Classified post: ", classifiedPost);

      classifiedUpdates.push(classifiedPost);
      try {
        await this.intentRepository.saveClassifiedIntent(classifiedPost);
      } catch (error) {
        console.error("Error saving classified intent:", error);
      }
    }

    return classifiedUpdates;
  }

  async getActionToBeTaken(
    classifiedIntent: ClassifiedIntentFromAgent
  ): Promise<any> {
    console.log("Getting actions to be taken...");

    const action = await this.professorAgent.invoke(classifiedIntent);

    return action;
  }

  public async generateActions(): Promise<void> {
    const classifiedUpdates = await this.getUpdatesAndClassify();

    console.log("Classified Updates: ", classifiedUpdates);
    if (classifiedUpdates.length === 0) {
      console.log("No classified updates found. Exiting action generation.");
      return;
    } else {
      for (const classifiedUpdate of classifiedUpdates) {
        const actionToBeTaken = await this.getActionToBeTaken(classifiedUpdate);

        const parsedAction: ProfessorAgentAction = JSON.parse(actionToBeTaken);

        // Save actions
        const actionSaved = await this.actionRepository.saveAction(
          parsedAction
        );
        if (parsedAction.actionToBeTaken === "create_forum_post") {
          // Add a 1s delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const postResponse = await this.moodleClient.createAnswerOnPost(
            parseInt(parsedAction.metadata.postId),
            parsedAction.content,
            "PROF AI Response: "
          );

          if (
            (postResponse && postResponse.status === 200) ||
            postResponse.status === 201
          ) {
            console.log(
              `Successfully created forum post with ID: ${postResponse.data.postid}`
            );

            // Save the updated action back to the database
            await this.actionRepository.updateAction(
              actionSaved.id,
              true,
              true,
              new Date()
            );
          } else {
            console.log(
              "Failed to create forum post: ",
              JSON.stringify(postResponse)
            );

            // Save the action as unsuccessful
            await this.actionRepository.updateAction(
              actionSaved.id,
              true,
              false,
              new Date()
            );
          }
        }
      }
    }
  }
}
