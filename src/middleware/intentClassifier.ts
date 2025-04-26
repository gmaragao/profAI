import { IntentAgent } from "@/agent/intentAgent";
import { ForumPostsResponse } from "@/models/moodleTypes";

export class IntentClassifier {
  private intentAgent = new IntentAgent();

  async classifyAndSummarizePosts(
    response: ForumPostsResponse
  ): Promise<{ intent: string; summary: string }[]> {
    const results: { intent: string; summary: string }[] = [];

    for (const post of response.posts) {
      const formattedPost = {
        userId: post.author.id,
        courseName: post.subject,
        inputText: post.message,
        forumId: response.forumid,
        postId: post.id,
        source: "message",
        subject: post.subject,
        message: post.message,
      };

      const prompt = JSON.stringify(post);

      console.log("Prompt to Ollama: ", post.message);
      const agentResponse = await this.intentAgent.processPrompt(prompt);
      results.push(agentResponse);
    }

    return results;
  }
}
