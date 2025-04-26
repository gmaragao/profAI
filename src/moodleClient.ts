import axios from "axios";
import { config } from "./config";
import { EnrolledUser, ForumPostsResponse } from "./models/moodleTypes";

export class MoodleClient {
  private baseUrl = config.moodle.baseUrl;
  private token = config.moodle.token;

  async getCourses(): Promise<any> {
    try {
      const response = await axios.get(
        "http://localhost:8080/webservice/rest/server.php?wstoken=1c37bcdd46b40749639659fb7184ef67&wsfunction=core_course_get_contents&courseid=3&moodlewsrestformat=json"
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching courses from Moodle:", error);
      throw error;
    }
  }

  async getEnrolledUsers(courseId: string): Promise<EnrolledUser[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/webservice/rest/server.php`,
        {
          params: {
            wstoken: this.token,
            wsfunction: "core_enrol_get_enrolled_users",
            moodlewsrestformat: "json",
            courseid: courseId,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching enrolled users from Moodle:", error);
      throw error;
    }
  }

  async getForumPosts(discussionId: string): Promise<ForumPostsResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/webservice/rest/server.php`,
        {
          params: {
            wstoken: this.token,
            wsfunction: "mod_forum_get_discussion_posts",
            moodlewsrestformat: "json",
            discussionid: discussionId,
          },
        }
      );
      return response.data as ForumPostsResponse;
    } catch (error) {
      console.error("Error fetching forum posts from Moodle:", error);
      throw error;
    }
  }
}
