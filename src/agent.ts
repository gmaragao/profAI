import { MoodleClient } from "./moodleClient";
import { OllamaClient } from "./ollamaClient";

export class LlmAgent {
  private ollamaClient = new OllamaClient();
  private moodleClient = new MoodleClient();

  async getCourseInformation(): Promise<void> {
    try {
      const courses = await this.moodleClient.getCourses();
      console.log("courses: ", courses);
      const courseNames = courses
        .map((course: any) => course.fullname)
        .join(", ");

      const prompt = `Here are the courses available: ${courseNames}. Provide a summary of these courses.`;
      const response = await this.ollamaClient.query(prompt);

      console.log("LLM Response:", response);
    } catch (error) {
      console.error("Error in LLM Agent:", error);
    }
  }

  async getEnrolledUsers(courseId: string): Promise<void> {
    try {
      const students = await this.moodleClient.getEnrolledUsers(courseId);
      console.log("students: ", students);
      const studentNames = students
        .map((student: any) => `${student.firstname} ${student.lastname}`)
        .join(", ");

      const prompt = `Here are the students enrolled in the course with ID ${courseId}: ${studentNames}. Provide a summary of these students.`;
      const response = await this.ollamaClient.query(prompt);

      console.log("LLM Response:", response);
    } catch (error) {
      console.error("Error in LLM Agent:", error);
    }
  }
}
