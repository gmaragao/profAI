type WeeklySummary = {
  weekOverview: string; // A brief description of the week's focus or theme
  keyActivities: Array<{
    type: string; // e.g., "forum", "assignment", "quiz"
    title: string;
    details: string;
  }>;
  assignmentsSummary: Array<{
    title: string;
    deadline: string;
    status: {
      submitted: number;
      pending: number;
    };
  }>;
  discussionsHighlights: Array<{
    title: string;
    topPosts: Array<{
      author: string;
      content: string;
      timeCreated: string;
    }>;
  }>;
};

type WeeklySummaryInput = {
  actionsSummary: Array<{
    actionToBeTaken: string; // e.g., "create_announcement", "reply_to_forum_post"
    reason: string;
    wasActionTaken: boolean;
    actionSuccessful: boolean | null;
    content: string; // The content of the post, message, announcement
    metadata: {
      userId: string;
      courseId: string;
      forumId: string;
      postId: string;
      intent: string;
      source: string;
    };
    createdAt: string; // Format: "YYYY-MM-DDTHH:mm:ssZ"
    updatedAt: string | null; // Format: "YYYY-MM-DDTHH:mm:ssZ" or null
  }>;
};
