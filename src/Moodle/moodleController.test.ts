import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../config";
import { MoodleClient } from "./moodleController";

vi.mock("axios");
vi.mock("../config", () => ({
  config: {
    moodle: {
      baseUrl: "http://test-moodle.com/webservice/rest/server.php",
      token: "test-token",
    },
  },
}));

describe("MoodleClient", () => {
  let moodleClient: MoodleClient;

  beforeEach(() => {
    moodleClient = new MoodleClient();
    vi.mocked(axios.get).mockClear();
    vi.mocked(axios.post).mockClear();
  });

  describe("getForumPosts", () => {
    it("should fetch forum posts correctly", async () => {
      const mockResponse = {
        data: {
          posts: [
            { id: 1, subject: "Post 1" },
            { id: 2, subject: "Post 2" },
          ],
          forumid: 123,
          courseid: 456,
          warnings: [],
        },
      };

      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moodleClient.getForumPosts("123");

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          "http://test-moodle.com/webservice/rest/server.php"
        ),
        {
          params: {
            wstoken: "test-token",
            wsfunction: "mod_forum_get_discussion_posts",
            moodlewsrestformat: "json",
            discussionid: "123",
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getUpdatesSince", () => {
    it("should fetch updates since a timestamp", async () => {
      // Mock the initial updates response
      const mockUpdatesResponse = {
        data: {
          instances: [
            {
              contextlevel: "module",
              id: 123,
              updates: [
                {
                  name: "discussions",
                  timeupdated: 1622548800,
                  itemids: [456],
                },
              ],
            },
          ],
          warnings: [],
        },
      };

      // Mock the discussion post details response
      const mockPostResponse = {
        data: {
          post: {
            id: 456,
            subject: "Test Post",
            message: "Test content",
            author: {
              id: 789,
              fullname: "Test User",
            },
            timecreated: 1622548800,
            timemodified: 1622548800,
          },
        },
      };

      // Setup axios mock for both calls
      (axios.get as jest.Mock)
        .mockResolvedValueOnce(mockUpdatesResponse)
        .mockResolvedValueOnce(mockPostResponse);

      const result = await moodleClient.getUpdatesSince(123, 1622548000);

      // Check first call to get updates
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          "http://test-moodle.com/webservice/rest/server.php"
        ),
        {
          params: {
            wstoken: "test-token",
            wsfunction: "core_course_get_updates_since",
            moodlewsrestformat: "json",
            courseid: 123,
            since: 1622548000,
            "filter[discussions]": "",
          },
        }
      );

      // Check second call to get post details
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          "http://test-moodle.com/webservice/rest/server.php"
        ),
        {
          params: {
            wstoken: "test-token",
            wsfunction: "mod_forum_get_discussion_post",
            moodlewsrestformat: "json",
            postid: 456,
          },
        }
      );

      // Check the returned data format
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 456,
          subject: "Test Post",
          content: "Test content",
          authorFullName: "Test User",
          authorId: 789,
          timeCreated: 1622548800,
          timeModified: 1622548800,
          typeName: "forum",
        })
      );
    });
  });

  describe("createAnswerOnPost", () => {
    it("should create an answer on a post", async () => {
      const mockResponse = {
        status: 200,
        data: { postid: 123 },
      };

      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moodleClient.createAnswerOnPost(
        123,
        "This is a test answer",
        "Test Answer"
      );

      expect(axios.post).toHaveBeenCalledWith(
        `${config.moodle.baseUrl}/webservice/rest/server.php`,
        {},
        {
          params: {
            wstoken: "test-token",
            wsfunction: "mod_forum_add_discussion_post",
            moodlewsrestformat: "json",
            postid: 123,
            message: "This is a test answer",
            subject: "Test Answer",
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
