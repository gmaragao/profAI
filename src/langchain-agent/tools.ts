import { MoodleClient } from "@/moodleClient";
import MemoryRepository from "@/repository/memoryRepository";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// A tool for fetching assignments
const moodleClient = new MoodleClient();
const memoryRepository = new MemoryRepository();

export const FetchForumPostsTool = tool(moodleClient.getForumPosts, {
  name: "get_forum_posts",
  description: "Call to retrieve posts for a given forumId",
  schema: z.object({
    discussionId: z.string(),
  }),
});

export const FetchCourseInformation = tool(
  memoryRepository.getCourseInformation,
  {
    name: "get_course_information",
    description:
      "Call to retrieve course information. Including course structure, assignments, and grades.",
    schema: z.object({
      courseId: z.string(),
    }),
  }
);

/* // A tool for fetching a single student’s grade
export const FetchGradeTool = new Tool({
  name: "get_grade",
  description: "Call to retrieve the grade for a student in an assignment",
  async func(input: string) {
    const { studentId, assignmentId } = JSON.parse(input);
    const grade = await getGrade(studentId, assignmentId);
    return JSON.stringify(grade);
  },
});
 */
/* // A tool for writing memory (structured + vector)
export const WriteMemoryTool = new Tool({
  name: "save_memory",
  description:
    "Save a short summary and metadata to structured + vector memory",
  async func(input: string) {
    const { studentId, summary, metadata } = JSON.parse(input);
    await writeMemory(studentId, summary, metadata);
    return "MEMORY_SAVED";
  },
});
 */
