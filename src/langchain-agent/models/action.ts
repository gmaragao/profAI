type Action = {
  functionToBeCalled: {
    name: string;
    args: {
      [key: string]: any;
    };
  };
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
