// src/moodle/moduleDispatchMap.ts

export type MoodleModuleType =
  | "discussions"
  | "assign"
  | "resource"
  | "quiz"
  | "page"
  | "url"
  | "book"
  | "lesson";

interface ModuleHandler {
  description: string;
  detailApi: string;
  paramBuilder: (instanceId: number, update: any) => Record<string, any>;
}

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
      paramBuilder: (_, __) => ({}), // course ID might be used instead
    },
    page: {
      description: "Moodle Page content",
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
    url: {
      description: "External links",
      detailApi: "core_course_get_contents",
      paramBuilder: (_, __) => ({}),
    },
    book: {
      description: "Multi-page book resource",
      detailApi: "mod_book_get_books_by_courses",
      paramBuilder: (_, __) => ({}),
    },
    lesson: {
      description: "Interactive lessons",
      detailApi: "mod_lesson_get_lesson",
      paramBuilder: (lessonId, __) => ({
        lessonid: lessonId,
      }),
    },
  };
