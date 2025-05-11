import { MoodleController } from "@/Moodle/moodleController";
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
    private moodleClient: MoodleController
  ) {}

  runPendingActions = async (): Promise<void> => {
    const pendingActions = await this.memoryRepository.getPendingActions();

    pendingActions.forEach(async (action) => {
      this.isActionDue(action)
        ? await this.executeAction(action)
        : console.log(
            `Action ${action.id} is not due yet. Waiting for the next check.`
          );
    });
  };

  private isActionDue = (action: any): boolean => {
    const currentTime = new Date();
    const actionTime = new Date(action.dueDate);
    const timeDiff = currentTime.getTime() - actionTime.getTime();

    // Check if the action is due based on the specified interval
    return timeDiff >= action.interval * 60 * 1000;
  };

  // TODO -> Add an activity diagram to explain this part
  // TODO -> Add this logic into the MessageDispatcher
  private executeAction(action: any) {
    if (action.type === "create_forum_post") {
      console.log(`Executing action: ${action.id}`);

      // Logic to create a forum post
      // Perform the action (e.g., send a notification)
      // After executing, update the action status in the repository
      this.memoryRepository.update("actions", action.id, {
        status: "completed",
      });
    } else if (action.type === "create_new_answer_on_post") {
      console.log(`Executing action: ${action.id}`);

      // Logic to create a new forum post
      this.moodleClient.createAnswerOnPost(action.postId, action.content);

      // Perform the action (e.g., send a notification)
      // After executing, update the action status in the repository
      this.memoryRepository.update("actions", action.id, {
        status: "completed",
      });
    } else if (action.type === "send_direct_message") {
      console.log(`Executing action: ${action.id}`);

      // Logic to send a direct message
      // Perform the action (e.g., send a notification)
      // After executing, update the action status in the repository
      this.memoryRepository.update("actions", action.id, {
        status: "completed",
      });
    }
  }
}
