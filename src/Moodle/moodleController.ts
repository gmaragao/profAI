import axios from "axios";
import { config } from "../config";
import { MoodleForumPostResponse } from "./models/forumPost";
import { ForumPostsResponse } from "./models/moodleTypes";
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

  /**
   * @description
   * Fetches forum posts for a specific discussion in Moodle.
   * This function sends a GET request to the Moodle web service
   * with the necessary parameters to retrieve posts
   * for a given discussion ID.
   *
   * @param discussionId - The ID of the discussion for which to fetch posts.
   * @returns {Promise<ForumPostsResponse>} - The response containing forum posts for the discussion.
   */
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

  /**
   * @description
   * Fetches updates from Moodle since a specified timestamp.
   * This function retrieves updates for a specific course
   * and returns detailed information about each update,
   * including discussions (forum posts) and their details.
   * It uses the Moodle web service to get updates
   * and then fetches detailed information for each update
   * using the appropriate module handler.
   *
   *
   * @param courseId - The ID of the course for which to fetch updates.
   * @param since
   * @returns
   */
  async getUpdatesSince(
    courseId: number,
    since: number
  ): Promise<DetailedUpdates[]> {
    try {
      const params = {
        wstoken: this.token,
        wsfunction: "core_course_get_updates_since",
        moodlewsrestformat: "json",
        courseid: courseId,
        since: since,
        "filter[discussions]": "", // Only getting discussions (posts) for now, this parameter needs to be changed in case of support for different module types
      };

      // Fetch updates since the given timestamp
      const response = await axios.get(this.baseUrl, { params });
      const moodleUpdateResponse: MoodleUpdateResponse = response.data;
      var instances = moodleUpdateResponse.instances || [];

      // Iterate over each update and fetch details
      const detailedUpdates: DetailedUpdates[] = [];
      for (const instance of instances) {
        for (const update of instance.updates || []) {
          const modname = update.name as MoodleModuleType; // Assume modname is provided
          const moduleHandler = moodleModuleDispatchMap[modname];

          if (!moduleHandler) {
            console.warn(`No handler found for module type: ${modname}`);
            continue;
          }
          if (update.itemids && update.itemids.length !== 0) {
            for (const itemId of update.itemids) {
              // Add a delay for each request in order to not overload moodle with requests
              await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
              const detailParams = moduleHandler.paramBuilder(itemId, update);

              const details = await this.fetchModuleDetails(
                moduleHandler.detailApi,
                detailParams
              );

              // If details contain a post, use the data from the post
              if (details.post) {
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
                  moduleId: itemId, // Use itemId as moduleId,
                  typeName: "forum",
                  createdAt: new Date().toISOString(),
                });
              }

              // TODO --> Map other module types similarly (e.g., assign, quiz, etc.) (for future)
              // For now, we are only handling forum posts (discussions)
            }
          }
        }
      }

      return detailedUpdates;
    } catch (error) {
      console.error("Error fetching updates from Moodle:", error);
      throw error;
    }
  }

  /**
   * @description
   * Call a Moodle API function to fetch module details.
   * This function is generic and can be used to fetch details
   * for any module type by providing the appropriate API function
   * and parameters.
   * This is useful for fetching details of forum posts, assignments, quizzes, etc.
   * It constructs the full URL with the necessary parameters
   * and makes a GET request to the Moodle web service.
   *
   * @param apiFunction - The Moodle API function to call (e.g., 'mod_forum_get_discussion_post').
   * @param params - The parameters to pass to the API function.
   * @returns {Promise<any>} - The response data from the Moodle API.
   */
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

  /**
   * @description
   * Creates a new answer on a specific post in a Moodle forum.
   * This function sends a POST request to the Moodle web service
   * with the necessary parameters to create a new discussion post.
   *
   * @param postId - The ID of the post to which the answer is being created.
   * @param content - The content of the answer being posted.
   * @param subject - The subject of the answer being posted.
   * @returns {Promise<any>} - The response from the Moodle API after creating the answer.
   */
  async createAnswerOnPost(
    postId: number,
    content: string,
    subject: string
  ): Promise<any> {
    try {
      console.log("Creating new answer on post with ID:", postId);
      const response = await axios.post(
        `${this.baseUrl}/webservice/rest/server.php`,
        {},
        {
          params: {
            wstoken: this.token,
            wsfunction: "mod_forum_add_discussion_post",
            moodlewsrestformat: "json",
            postid: postId,
            message: content,
            subject,
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Error creating new answer on post:", error);
      throw error;
    }
  }
}
