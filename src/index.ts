import { IntentAgent } from "./agent/intentAgent";
import agent from "./langchain-agent/agent";
import { IntentClassifier } from "./middleware/intentClassifier";
import { MoodleClient } from "./moodleClient";

(async () => {
  //const agent = new LlmAgent();
  //await agent.getCourseInformation();
  const intentAgent = new IntentAgent();
  const intentDetector = new IntentClassifier();
  const moodleClient = new MoodleClient();

  /*   const forumPosts = await moodleClient.getForumPosts("4");

  const classifiedPosts = await intentDetector.classifyAndSummarizePosts(
    forumPosts
  );
 */
  const professorAgent = agent;

  const classifiedDataString = JSON.stringify({
    studentId: "3",
    courseId: "3",
    summarizedInput:
      "Student is asking for information about the course structure.",
    forumId: "4",
    postId: "5",
    intent: "subject_knowledge_question",
    source: "message",
  });

  const response = await professorAgent.invoke({
    messages: [
      {
        role: "user",
        content: classifiedDataString,
      },
    ],
  });

  console.log("Response from agent: ", response);
})();
