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

class ProfessorAgent {
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
    
    There are two kinds of tools you know:
    - TOOLS: for retrieving additional information (example: get_course_information, get_forum_posts).
    - POSTING_TOOLS: for creating new content. The tools for posting are: {toolsForPosting}.
    
    Rules you must always follow:
    Important: Never leave a student's question unanswered in the forum. Always generate a reply.


    1. If the source is a forum post or a message, you MUST create new content as a response, using a POSTING_TOOL.
       - Even if you have to fetch course information first, you must then proceed to create a post replying to the original post.
       - Do NOT skip this step.
    2. Populate "functionToBeCalled" ONLY when you are creating new content (with a POSTING_TOOL). It must be on a JSON object.
    3. If you are fetching information using a normal tool, leave "functionToBeCalled" as null during that fetch.
    4. NEVER ask the user for more details. Assume everything needed is already provided.
    5. Set the priority (0.0 to 1.0) based on the urgency of answering.
    6. Set the confidence (0.0 to 1.0) based on your certainty about the answer.
    7. ALWAYS respond strictly in this JSON format, even when you are not certain about the answer:
    
    {{
      "functionToBeCalled": {{
        "name": string | null,
        "args": {{
          [key: string]: any
        }}
      }},
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

    IMPORTANT: All the fields must be filled, including the functionToBeCalled, even if it is null.
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

    console.log("input variables:", inputVariables);
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
    console.log("Response: ", response);

    return response.content;
  }
}

export default ProfessorAgent;
