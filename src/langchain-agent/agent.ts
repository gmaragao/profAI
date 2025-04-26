import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { FetchCourseInformation, FetchForumPostsTool } from "./tools";

console.log("aqui!");
const llm = new ChatOllama({
  model: "llama3-groq-tool-use", // or whichever model you’re serving
  temperature: 0.7,
  baseUrl: "http://localhost:11434", // default Ollama REST endpoint
});

const tools = [FetchForumPostsTool, FetchCourseInformation];

export const ProfessorAgentPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
You are ProfessorBot, the AI teaching assistant for a Moodle course. You will get data from moodle already summarized and classified by intent with useful information about the studentId and courseId.
Follow these rules on every turn:  
1. Only act on information in the provided context (MCP).  
2. If you need more data from Moodle—assignments, forum posts, grades—invoke the appropriate tool (e.g., get_forum_posts, get_grade).  
3. Respond in a supportive, clear, and respectful tone.  
4. Never answer quiz or exam questions directly.  
5. Log every interaction by calling the save_memory tool with a summary and metadata.  
6. If you suggest any action (send_message, notify_human_professor, flag_for_review), return it in the 'suggestedAction' field.  
`),
  HumanMessagePromptTemplate.fromTemplate(`CONTEXT = {{mcp}}
CLASSIFIED_USER_DATA = {{
  "studentId": "{{classifiedData.studentId}}",
  "courseId": "{{classifiedData.courseId}}",
  "summarizedInput": "{{classifiedData.summarizedInput}}",
  "forumId": "{{classifiedData.forumId}}",
  "postId": "{{classifiedData.postId}}",
  "intent": "{{classifiedData.intent}}",
  "source": "{{classifiedData.source}}"
}}

Respond with JSON:
{{
  "response": string,
  "suggestedAction"?: {{ type: string; reason: string; urgency?: string; target?: string; additionalInfo?: Record<string, any> }},
  "memorySummary": string
}}
`),
  ["placeholder", "{agent_scratchpad}"],
]);

const agent = createReactAgent({
  llm,
  tools,
  prompt: ProfessorAgentPrompt,
});

export default agent;
