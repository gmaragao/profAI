import { EnrolledUser } from "@/models/moodleTypes";
import axios from "axios";

/* export const getAssignments = async (
  courseId: string
): Promise<MoodleActivity[]> => {
  const response = await axios.get(
    `${process.env.MOODLE_API_URL}/get_assignments`,
    {
      params: { courseId, token: process.env.MOODLE_TOKEN },
    }
  );
  return response.data.assignments;
};
 */
export const getStudents = async (
  courseId: string
): Promise<EnrolledUser[]> => {
  const response = await axios.get(
    `${process.env.MOODLE_API_URL}/get_students`,
    {
      params: { courseId, token: process.env.MOODLE_TOKEN },
    }
  );
  return response.data.students;
};
