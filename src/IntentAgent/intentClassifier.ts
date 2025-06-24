import {
  ClassifiedIntentFromAgent,
  IntentAgent,
} from "@/IntentAgent/intentAgent";

export type ClassifierInput = {
  userId: number;
  courseId: number;
  inputText: string;
  forumId: number;
  postId: number;
  source: string;
  subject?: string;
  message?: string;
  createdAt: string;
  updatedAt?: string;
};

export class IntentClassifier {
  constructor(private intentAgent: IntentAgent) {}

  async classifyAndSummarizePost(
    inputToClassify: ClassifierInput
  ): Promise<ClassifiedIntentFromAgent> {
    const prompt = JSON.stringify(inputToClassify);

    const agentResponse = await this.intentAgent.classifyIntent(prompt);

    return agentResponse;
  }
}
