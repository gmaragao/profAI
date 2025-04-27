import { IntentAgent } from "./agent/intentAgent";
import ProfessorAgent from "./langchain-agent/agent";
import { IntentClassifier } from "./middleware/intentClassifier";
import { Orchestrator } from "./middleware/orchestrator";
import { MoodleClient } from "./moodleClient";
import MemoryRepository from "./repository/memoryRepository";

(async () => {
  //const agent = new LlmAgent();
  const professorAgent = new ProfessorAgent();
  const intentAgent = new IntentAgent();
  //await agent.getCourseInformation();
  const intentClassifier = new IntentClassifier(intentAgent);
  const moodleClient = new MoodleClient();

  const memoryRepository = new MemoryRepository();
  const orchestrator = new Orchestrator(
    intentClassifier,
    memoryRepository,
    moodleClient
  );

  //const proactiveEngine = new ProactiveEngine(orchestrator);

  //proactiveEngine.run();

  const forumPosts = await moodleClient.getForumPosts("4");

  const classifiedPosts = await intentClassifier.classifyAndSummarizePosts(
    forumPosts
  );

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
  for (const classifiedData of classifiedPosts) {
    console.log("classifiedData: ", classifiedData);
    // transform string from classifieidData into object
    const parsedData = JSON.parse(classifiedData);
    console.log("Parsed Data: ", parsedData);
    const response = await professorAgent.invoke(parsedData);
    console.log("Response from agent: ", response);
  }
})();
