import { IntentAgent } from "@/IntentAgent/intentAgent";
import dotenv from "dotenv";
import { IntentClassifier } from "./middleware/intentClassifier";
import { Orchestrator } from "./middleware/orchestrator";
import { MoodleClient } from "./Moodle/moodleController";
import ProfessorAgent from "./ProfessorAgent/agent";
import MemoryRepository from "./repository/memoryRepository";
dotenv.config();

(async () => {
  console.log("DATABASE_URL:", process.env.DATABASE_URL); //const agent = new LlmAgent();
  const professorAgent = new ProfessorAgent();
  const intentAgent = new IntentAgent();
  //await agent.getCourseInformation();
  const intentClassifier = new IntentClassifier(intentAgent);
  const moodleController = new MoodleClient();

  const memoryRepository = new MemoryRepository();
  const orchestrator = new Orchestrator(
    intentClassifier,
    memoryRepository,
    moodleController
  );

  //const result = await orchestrator.getPrisma();

  const result = await orchestrator.getLatestKnownForumData();

  //const forumPosts = await moodleController.getForumPosts("4");

  //console.log("Forum Posts: ", forumPosts);

  //const proactiveEngine = new ProactiveEngine(orchestrator);

  //proactiveEngine.run();

  /* const forumPosts = await moodleController.getForumPosts("4");

  const classifiedPosts = await intentClassifier.classifyAndSummarizePosts(
    forumPosts
  ); */

  /*   const classifiedData = {
    userId: "3",
    courseId: "3",
    summarizedInput: "What is the date of the exam?",
    forumId: "4",
    postId: "5",
    intent: "general_question",
    source: "forum_post",
  };
 */
  //console.log("Classified Data: ", classifiedData);
  //const response = await professorAgent.invoke(classifiedData);
  /*   for (const classifiedData of classifiedPosts) {
    console.log("classifiedData: ", classifiedData);
    // transform string from classifieidData into object
    const parsedData = JSON.parse(classifiedData);
    console.log("Parsed Data: ", parsedData);
    const response = await professorAgent.invoke(parsedData);
    console.log("Response from agent: ", response);
  } */
})();
