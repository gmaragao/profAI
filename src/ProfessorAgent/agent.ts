import type { ToolCall } from "@langchain/core/messages/tool";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import {
  CreateAnswerOnPost,
  FetchCourseInformation,
  SaveMemory,
} from "./tools";

export class ProfessorAgent {
  private llm: ChatOllama;
  private tools: DynamicStructuredTool[];
  private toolsForPosting: DynamicStructuredTool[];
  private prompt: ChatPromptTemplate;

  constructor() {
    this.llm = new ChatOllama({
      model: "llama3-groq-tool-use",
      temperature: 0.3,
      baseUrl: "http://localhost:11434",
    });

    this.tools = [FetchCourseInformation, SaveMemory];
    this.toolsForPosting = [CreateAnswerOnPost];

    this.prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
    You are ProfessorBot, the AI teaching assistant for a Moodle course.
    
    You always receive fully classified and complete user input data:
    - userId
    - courseId
    - summarizedInput
    - forumId
    - postId
    - intent
    - source
    
    You can fully trust that all IDs and necessary information are present in the USER_DATA block.
    
    - TOOLS: for retrieving additional information.

    1. If you are fetching information using a normal tool, leave "actionToBeTaken" field as null during that fetch.
    2. NEVER ask the user for more details. Assume everything needed is already provided.
    3. Set the priority (0.0 to 1.0) based on the urgency of answering.
    4. Set the confidence (0.0 to 1.0) based on your certainty about the answer.
    5. The actionToBeTaken field must be filled with one of these options:
    Available action types:
    - "create_forum_post": Create a new post in a forum
    - "reply_to_forum_post": Reply to an existing forum post
    - "send_direct_message": Send a private message to a student
    - "create_announcement": Create a course-wide announcement
    - "grade_feedback": Provide feedback on student submission
    - "no_action": No action required at this time

    5. ALWAYS respond strictly in this JSON format defined as:
    {{
      "actionToBeTaken": string
      "reason": string,
      "priority": number,
      "confidence": number,
      "content": string,
      "metadata": {{
        "userId": string,
        "courseId": string,
        "forumId": string,
        "postId": string,
        "intent": string,
        "source": string
      }},
      "memorySummary": string
    }}

    IMPORTANT: The content field should be translated to portuguese.
    `),
      HumanMessagePromptTemplate.fromTemplate("USER_DATA: {user_data}"),
    ]);
  }

  public async invoke(classifiedData: {
    userId: string;
    courseId: string;
    summarizedInput: string;
    forumId: string;
    postId: string;
    intent: string;
    source: string;
  }) {
    const toolsByName = {
      fetchCourseInformation: FetchCourseInformation,
      saveMemory: SaveMemory,
    } as {
      [key: string]: DynamicStructuredTool;
    };

    const inputVariables = {
      userId: classifiedData.userId,
      courseId: classifiedData.courseId,
      summarizedInput: classifiedData.summarizedInput,
      forumId: classifiedData.forumId,
      postId: classifiedData.postId,
      intent: classifiedData.intent,
      source: classifiedData.source,
    };

    const messages = await this.prompt.formatMessages({
      tools: this.tools,
      user_data: JSON.stringify(inputVariables),
      toolsForPosting: JSON.stringify(
        this.toolsForPosting.map((tool) => ({
          name: tool.name,
          description: tool.description,
          argsSchema: tool.schema || {},
        }))
      ),
    });

    const aiMessage = await this.llm.bindTools(this.tools).invoke(messages);

    const toolCallsToExecute = (aiMessage.tool_calls as ToolCall[]).filter(
      (toolCall) => toolsByName[toolCall.name]
    );

    for (const toolCall of toolCallsToExecute) {
      console.log("Tool call: ", toolCall);
      const selectedTool = toolsByName[toolCall.name];
      const toolMessage = await selectedTool.invoke(toolCall);
      console.log(`Calling the ${toolCall.name} tool.`);
      messages.push(toolMessage);
    }

    const response = await this.llm.invoke(messages);
    return response.content;
  }
}

export default ProfessorAgent;
