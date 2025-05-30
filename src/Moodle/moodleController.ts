import axios from "axios";
import { config } from "../config";
import { EnrolledUser, ForumPostsResponse } from "../Models/moodleTypes";
import { MoodleForumPostResponse } from "./models/forumPost";
import { DetailedUpdates, MoodleUpdateResponse } from "./models/updatesSince";
import { moodleModuleDispatchMap, MoodleModuleType } from "./moduleDispatchMap";

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
      const response = await axios.get(`${this.baseUrl}`, {
        params: {
          wstoken: this.token,
          wsfunction: "core_enrol_get_enrolled_users",
          moodlewsrestformat: "json",
          courseid: courseId,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching enrolled users from Moodle:", error);
      throw error;
    }
  }

  async getForumPosts(discussionId: string): Promise<ForumPostsResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}`, {
        params: {
          wstoken: this.token,
          wsfunction: "mod_forum_get_discussion_posts",
          moodlewsrestformat: "json",
          discussionid: discussionId,
        },
      });
      return response.data as ForumPostsResponse;
    } catch (error) {
      console.error("Error fetching forum posts from Moodle:", error);
      throw error;
    }
  }

  // Need to cleanup code and remove hardcoded values
  // This is getting the updates from Moodle since a specific timestamp
  // And getting the details of each update
  async getUpdatesSince(since: string): Promise<any> {
    try {
      const params = {
        wstoken: this.token,
        wsfunction: "core_course_get_updates_since",
        moodlewsrestformat: "json",
        courseid: 3, // Replace with your course ID
        since: 1717142400, // Include the since parameter
        "filter[discussions]": "",
      };

      // Fetch updates since the given timestamp
      const response = await axios.get(this.baseUrl, { params });
      console.log("response from Moodle:", response.data);
      const moodleUpdateResponse: MoodleUpdateResponse = response.data;
      const instances = moodleUpdateResponse.instances || [];

      // Iterate over each update and fetch details
      const detailedUpdates: DetailedUpdates[] = [];
      for (const instance of instances) {
        for (const update of instance.updates || []) {
          console.log("update: ", update);
          const modname = update.name as MoodleModuleType; // Assume modname is provided
          const moduleHandler = moodleModuleDispatchMap[modname];

          if (!moduleHandler) {
            console.warn(`No handler found for module type: ${modname}`);
            continue;
          }
          console.log("item ids: ", update.itemids);
          if (update.itemids && update.itemids.length !== 0) {
            for (const itemId of update.itemids) {
              const detailParams = moduleHandler.paramBuilder(itemId, update);

              const details = await this.fetchModuleDetails(
                moduleHandler.detailApi,
                detailParams
              );

              // If details contain a post, use the data from the post
              if (details.post) {
                // Cast details to MoodleForumPostResponse
                const forumPostResponse = details as MoodleForumPostResponse;
                detailedUpdates.push({
                  id: forumPostResponse.post.id,
                  subject: forumPostResponse.post.subject,
                  content: forumPostResponse.post.message,
                  authorFullName:
                    forumPostResponse.post.author?.fullname || "Unknown",
                  authorId: forumPostResponse.post.author?.id!,
                  timeCreated: forumPostResponse.post.timecreated,
                  timeModified: forumPostResponse.post.timemodified,
                  moduleId: itemId, // Use itemId as moduleId
                });
              }

              // TODO --> Map other module types similarly (e.g., assign, quiz, etc.)
              // For now, we are only handling forum posts
            }
          }
        }
      }

      console.log("Detailed updates:", detailedUpdates);
      return detailedUpdates;
    } catch (error) {
      console.error("Error fetching updates from Moodle:", error);
      throw error;
    }
  }

  async fetchModuleDetails(
    apiFunction: string,
    params: Record<string, any>
  ): Promise<any> {
    try {
      const fullParams = {
        wstoken: this.token,
        wsfunction: apiFunction,
        moodlewsrestformat: "json",
        ...params,
      };

      // Log the full URL for debugging
      const url = `${this.baseUrl}?${new URLSearchParams(
        fullParams
      ).toString()}`;
      console.log("Fetching module details from endpoint:", url);

      const response = await axios.get(this.baseUrl, { params: fullParams });
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for API: ${apiFunction}`, error);
      throw error;
    }
  }

  async createAnswerOnPost(postId: string, content: string): Promise<any> {
    try {
      console.log("Creating new answer on post with ID:", postId);
      const response = await axios.post(
        `${this.baseUrl}/webservice/rest/server.php`,
        {
          wstoken: this.token,
          wsfunction: "mod_forum_add_discussion_post",
          moodlewsrestformat: "json",
          postid: postId,
          content: content,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating new answer on post:", error);
      throw error;
    }
  }
}
