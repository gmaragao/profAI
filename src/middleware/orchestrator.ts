import { ProfessorAgent } from "../agents/professorAgent";
import { MessageDispatcher } from "../communication/messageDispatcher";
import { ContextBuilder } from "../context/contextBuilder";
import { MemoryRepository } from "../memory/memoryRepository";
import { ActionReporter } from "../reporting/actionReporter";
import { IntentClassifier } from "./intentClassifier";

export interface OrchestratorInput {
  rawInput: any;
  sourceId?: string;
  userId?: string;
  courseId?: string;
  metadata?: Record<string, any>;
}

export interface ClassifiedInput extends OrchestratorInput {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}

export interface ContextualizedInput extends ClassifiedInput {
  context: {
    relevantMemories: any[];
    courseContext?: any;
    userContext?: any;
  };
}

export interface SuggestedAction {
  type: string;
  payload: any;
  priority: number;
  metadata?: Record<string, any>;
}

export class Orchestrator {
  constructor(
    private intentClassifier: IntentClassifier,
    private professorAgent: ProfessorAgent,
    private contextBuilder: ContextBuilder,
    private memoryRepository: MemoryRepository,
    private messageDispatcher: MessageDispatcher,
    private actionReporter: ActionReporter
  ) {}

  async processInput(input: OrchestratorInput): Promise<void> {
    try {
      // Step 1: Classify intent using IntentAgent
      const classifiedInput = await this.classifyIntent(input);

      // Step 2: Build context using ContextBuilder and MemoryRepository
      //const contextualizedInput = await this.buildContext(classifiedInput);

      // Step 3: Process with ProfessorAgent to get suggested actions
      //const suggestedActions = await this.generateActions(classifiedInput);

      // Step 4: Dispatch actions through MessageDispatcher
      // const dispatchResults = await this.dispatchActions(suggestedActions);

      // Step 5: Save to memory
      /* await this.saveToMemory(
        contextualizedInput,
        suggestedActions,
        dispatchResults
      ); */

      // Step 6: Report actions
      //await this.reportActions(suggestedActions, dispatchResults);
    } catch (error) {
      console.error("Error in orchestration process:", error);
      throw error;
    }
  }
  /* 
  async handleProactiveTrigger(trigger: any): Promise<void> {
    // Handle scheduled triggers from ProactiveEngine
    const input: OrchestratorInput = {
      rawInput: trigger.data,
      metadata: {
        triggerType: trigger.type,
        triggerTime: new Date().toISOString(),
        isProactive: true,
        ...trigger.metadata,
      },
    };

    return this.processInput(input);
  }
 */
  private async classifyIntent(input: OrchestratorInput): Promise<any> {
    const classification =
      await this.intentClassifier.classifyAndSummarizePosts(input.rawInput);

    return {
      ...input,
      intent: classification.intent,
      confidence: classification.confidence,
      entities: classification.entities,
    };
  }

  private async buildContext(
    input: ClassifiedInput
  ): Promise<ContextualizedInput> {
    // Retrieve relevant memories
    const memories = await this.memoryRepository.retrieveRelevantMemories(
      input.intent,
      input.entities,
      input.userId,
      input.courseId
    );

    // Build full context
    const context = await this.contextBuilder.buildContext(input, memories);

    return {
      ...input,
      context,
    };
  }

  private async generateActions(
    input: ContextualizedInput
  ): Promise<SuggestedAction[]> {
    return this.professorAgent.suggestActions(input);
  }

  private async dispatchActions(actions: SuggestedAction[]): Promise<any[]> {
    return this.messageDispatcher.dispatchActions(actions);
  }

  private async saveToMemory(
    input: ContextualizedInput,
    actions: SuggestedAction[],
    results: any[]
  ): Promise<void> {
    const summary = this.generateInteractionSummary(input, actions, results);

    await this.memoryRepository.saveInteraction({
      input,
      actions,
      results,
      summary,
      timestamp: new Date().toISOString(),
    });
  }

  private generateInteractionSummary(
    input: ContextualizedInput,
    actions: SuggestedAction[],
    results: any[]
  ): string {
    // Generate a concise summary of the interaction
    // This could be done with a summarization method or by the professor agent
    return `Processed ${input.intent} intent and executed ${actions.length} actions`;
  }

  private async reportActions(
    actions: SuggestedAction[],
    results: any[]
  ): Promise<void> {
    await this.actionReporter.reportActions({
      actions,
      results,
      timestamp: new Date().toISOString(),
    });
  }
}
