export type ProfessorAgentAction = {
  actionToBeTaken: string;
  reason: string;
  priority: number;
  confidence: number;
  content: string;
  metadata: {
    userId: string;
    courseId: string;
    forumId: string;
    postId: string;
    intent: string;
    source: string;
  };
  memorySummary: string;
};
