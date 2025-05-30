// src/moodle/callMoodle.ts

import axios from "axios";

export interface MoodleCallOptions {
  function: string;
  params?: Record<string, any>;
}

export async function callMoodle<T = any>({
  function: wsfunction,
  params = {},
}: MoodleCallOptions): Promise<T> {
  const baseUrl = process.env.MOODLE_API_URL;
  const token = process.env.MOODLE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("Missing MOODLE_API_URL or MOODLE_TOKEN in environment");
  }

  const url = `${baseUrl}/webservice/rest/server.php`;

  try {
    const response = await axios.get<T>(url, {
      params: {
        wstoken: token,
        wsfunction,
        moodlewsrestformat: "json",
        ...params,
      },
    });

    if ((response.data as any).exception) {
      throw new Error(
        `Moodle API Exception: ${(response.data as any).message}`
      );
    }

    return response.data;
  } catch (error: any) {
    console.error(
      "Moodle API call failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}
