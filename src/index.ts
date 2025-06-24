import { IntentAgent } from "@/IntentAgent/intentAgent";
import dotenv from "dotenv";
import { IntentClassifier } from "./IntentAgent/intentClassifier";
import { IntentRepository } from "./IntentAgent/intentRepository";
import { Orchestrator } from "./Middleware/orchestrator";
import { MoodleClient } from "./Moodle/moodleClient";
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
  const orchestrator = new Orchestrator(
    intentClassifier,
    moodleClient,
    intentRepository,
    professorAgent
  );

  const proactiveEngine = new ProactiveEngine(orchestrator);

  console.log("Starting application...");

  try {
    await vectorStore.processPDFs();

    await proactiveEngine.run();
  } catch (error) {
    console.error("Error initializing application. Error::", error);
    process.exit(1);
  }
})();
