import type { ToolCall } from "@langchain/core/messages/tool";

import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import path from "path";
import { fileURLToPath } from "url";
import { GetRelevantKnowledge, GetSubjectMetadata } from "./tools";

import fs from "fs";

export class ProfessorAgent {
  private llm: ChatOllama;
  private tools: DynamicStructuredTool[];
  private prompt: ChatPromptTemplate;

  constructor() {
    this.llm = new ChatOllama({
      model: "llama3-groq-tool-use",
      temperature: 0.3,
      baseUrl: "http://localhost:11434",
    });

    this.tools = [GetRelevantKnowledge, GetSubjectMetadata];

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
    
    1. If you are fetching information using a normal tool, leave "actionToBeTaken" field as null during that fetch.
    2. NEVER ask the user for more details. Assume everything needed is already provided.
    3. Set the priority (0.0 to 1.0) based on the urgency of answering.
    4. Set the confidence (0.0 to 1.0) based on your certainty about the answer.
    5. The actionToBeTaken field must be filled with one of these options:
    Available action types:
    - "create_forum_post": Create a new post in a forum. This is also used to reply a post.
    - "send_direct_message": Send a private message to a student
    - "create_announcement": Create a course-wide announcement
    - "grade_feedback": Provide feedback on student submission
    - "no_action": No action required at this time

    5. ALWAYS respond strictly in this JSON format defined as:
    {{
      "actionToBeTaken": string
      "reason": string,  -- This field must contain the content in portuguese!
      "priority": number,
      "confidence": number,
      "content": string, -- This field must contain the content in portuguese!
      "metadata": {{
        "userId": string,
        "courseId": string,
        "forumId": string,
        "postId": string,
        "intent": string,
        "source": string
      }},
      "memorySummary": string --  This field must contain the content in portuguese!
    }}
    6. Use the tools provided to fetch information or perform actions. The tools can provide you knowledge about the subject, actions to get moodle data, rules of the course and also historical data of the course. You should always try to get the answer from the tools first, and only if you cannot find the answer, you should use your own knowledge.
    7. When calling a tool, translate the content to english, in order to get the best results from the tool. The tool will return the content in english, so you should translate it back to portuguese before returning the final response.
    
    You also should follow these extra instructions:
      {extra_instructions}
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
    const filePath = fileURLToPath(import.meta.url);
    const extraInstructionsPath = path.join(
      path.dirname(filePath),
      "extraInstructions.txt"
    );
    const extraInstructionsContent = fs
      .readFileSync(extraInstructionsPath, "utf-8")
      .replace(/\n/g, " ");

    const toolsByName = {
      getRelevantKnowledgeFromMaterial: GetRelevantKnowledge,
      getSubjectMetadata: GetSubjectMetadata,
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
      extra_instructions: JSON.stringify(extraInstructionsContent),
      user_data: JSON.stringify(inputVariables),
    });

    const aiMessage = await this.llm.bindTools(this.tools).invoke(messages);

    if (aiMessage.tool_calls === undefined) {
      console.error("No tool calls found in the LLM message.");
      return aiMessage.content;
    }

    const toolCallsToExecute = (aiMessage.tool_calls as ToolCall[]).filter(
      (toolCall) => toolsByName[toolCall.name]
    );

    for (const toolCall of toolCallsToExecute) {
      console.log(`Calling the ${toolCall.name} tool.`);

      const selectedTool = toolsByName[toolCall.name];
      try {
        const toolMessage = await selectedTool.invoke(toolCall);
        messages.push(toolMessage);
      } catch (error) {
        console.error(
          `Error invoking tool ${toolCall.name}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    const response = await this.llm.invoke(messages);
    return response.content;
  }
}

export default ProfessorAgent;
