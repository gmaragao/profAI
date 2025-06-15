export type MoodleModuleType = "discussions" | "assign" | "resource" | "quiz";

interface ModuleHandler {
  description: string;
  detailApi: string;
  paramBuilder: (instanceId: number, update: any) => Record<string, any>;
}

/**
 * Maps Moodle module types to their respective handlers.
 * Each handler provides a description, the API function to call for details,
 * and a parameter builder function that constructs the parameters
 * for the API call based on arguments provided.
 * This allows for dynamic handling of different module types
 * and their specific requirements.
 * IMPORTANT: Currently only 'discussions' is being used.

 * @example
 * const handler = moodleModuleDispatchMap['discussions'];
 * const params = handler.paramBuilder(postId, update);
 * handler.detailApi; // 'mod_forum_get_discussion_post'
 * params; // { postid: postId }
 * @returns {Record<MoodleModuleType, ModuleHandler>} A mapping of module types to their handlers.
 */
export const moodleModuleDispatchMap: Record<MoodleModuleType, ModuleHandler> =
  {
    discussions: {
      description: "Forum discussions or posts",
      detailApi: "mod_forum_get_discussion_post",
      paramBuilder: (postId, update) => ({
        postid: postId,
      }),
    },
    assign: {
      description: "Assignment submissions",
      detailApi: "mod_assign_get_submissions",
      paramBuilder: (assignId, _) => ({
        assignmentids: [assignId],
      }),
    },
    resource: {
      description: "Static file resources",
      detailApi: "core_course_get_contents",
      paramBuilder: (_, __) => ({}),
    },
    quiz: {
      description: "Quiz attempts and results",
      detailApi: "mod_quiz_get_user_attempts",
      paramBuilder: (quizId, update) => ({
        quizid: quizId,
      }),
    },
  };
