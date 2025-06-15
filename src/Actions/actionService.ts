import { getPrismaClient } from "@/database/prismaService";
import { IntentClassifier } from "@/IntentAgent/intentClassifier";
import { IntentRepository } from "@/IntentAgent/intentRepository";
import { Orchestrator } from "@/Middleware/orchestrator";
import { MoodleClient } from "@/Moodle/moodleController";
import { ProfessorAgent } from "@/ProfessorAgent/agent";
import { ProfessorAgentAction } from "@/ProfessorAgent/models/action";
import { ActionRepository } from "./actionRepository";

export class ActionService {
  constructor(
    private intentClassifier: IntentClassifier,
    private actionRepository: ActionRepository,
    private moodleClient: MoodleClient,
    private prisma = getPrismaClient(),
    private intentRepository: IntentRepository = new IntentRepository(),
    private professorAgent = new ProfessorAgent(),
    private orchestrator = new Orchestrator(
      intentClassifier,
      moodleClient,
      intentRepository,
      professorAgent
    )
  ) {}
  /**
   * Generates actions based on classified updates and saves them to the database.
   * It also handles the creation of forum posts if the action requires it.
   */
  public async generateActions(): Promise<void> {
    const classifiedUpdates = await this.orchestrator.getUpdatesAndClassify();

    console.log("Classified Updates: ", classifiedUpdates);
    if (classifiedUpdates.length === 0) {
      console.log("No classified updates found. Exiting action generation.");
      return;
    } else {
      for (const classifiedUpdate of classifiedUpdates) {
        const actionToBeTaken = await this.orchestrator.getActionToBeTaken(
          classifiedUpdate
        );

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
