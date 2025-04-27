import { IntentAgent } from "@/agent/intentAgent";
import { ForumPostsResponse } from "@/models/moodleTypes";

export class IntentClassifier {
  constructor(private intentAgent: IntentAgent) {}

  async classifyAndSummarizePosts(
    response: ForumPostsResponse
  ): Promise<any[]> {
    const results = [];

    for (const post of response.posts) {
      const formattedPost = {
        userId: post.author.id,
        courseName: post.subject,
        inputText: post.message,
        forumId: response.forumid,
        postId: post.id,
        source: "forum_post",
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
