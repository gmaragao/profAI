import { IntentAgent } from "@/IntentAgent/intentAgent";
import dotenv from "dotenv";
import { ActionRepository } from "./Actions/actionRepository";
import { ActionService } from "./Actions/actionService";
import { IntentClassifier } from "./IntentAgent/intentClassifier";
import { IntentRepository } from "./IntentAgent/intentRepository";
import { Orchestrator } from "./Middleware/orchestrator";
import { MoodleClient } from "./Moodle/moodleController";
import { ProactiveEngine } from "./ProactiveEngine";
import ProfessorAgent from "./ProfessorAgent/agent";
import { CustomVectorStore } from "./RAG/vectorStore";
dotenv.config();

(async () => {
  const professorAgent = new ProfessorAgent();
  const intentAgent = new IntentAgent();
  const intentRepository = new IntentRepository();
  const intentClassifier = new IntentClassifier(intentAgent);
  const moodleClient = new MoodleClient();
  const vectorStore = new CustomVectorStore();
  const actionRepository = new ActionRepository();
  const orchestrator = new Orchestrator(
    intentClassifier,
    moodleClient,
    intentRepository,
    professorAgent
  );
  const actionService = new ActionService(
    intentClassifier,
    actionRepository,
    moodleClient
  );
  const proactiveEngine = new ProactiveEngine(orchestrator, actionService);

  await vectorStore.processPDFs();

  await proactiveEngine.run();
})();
