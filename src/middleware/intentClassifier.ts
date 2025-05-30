import { IntentAgent } from "@/IntentAgent/intentAgent";
import { ForumPostsResponse } from "@/Models/moodleTypes";
import { ClassifiedResponse } from "./types";

export class IntentClassifier {
  constructor(private intentAgent: IntentAgent) {}

  async classifyAndSummarizePosts(
    response: ForumPostsResponse
  ): Promise<ClassifiedResponse[]> {
    const results = [];
    for (const post of response.posts) {
      const formattedPost = {
        userId: post.author.id,
        courseId: response.courseid,
        inputText: post.message,
        forumId: response.forumid,
        postId: post.id,
        source: "forum_post",
        subject: post.subject,
        message: post.message,
      };

      const prompt = JSON.stringify(formattedPost);

      const agentResponse = await this.intentAgent.classifyIntent(prompt);

      results.push(agentResponse);
    }

    return results;
  }
}
