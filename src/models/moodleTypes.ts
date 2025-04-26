export interface MoodleUser {
  id: number;
  username: string;
  fullname: string;
  email: string;
  firstaccess: number; // Timestamp
  lastaccess: number; // Timestamp
  suspended: boolean;
  roles: MoodleRole[];
}

export interface MoodleRole {
  id: number;
  name: string;
  shortname: string;
}

export interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  summary: string;
  startdate: number; // Timestamp
  enddate: number; // Timestamp
  visible: boolean;
  categoryid: number;
}

export interface MoodleCategory {
  id: number;
  name: string;
  description: string;
  parent: number;
  visible: boolean;
}

export interface MoodleEnrolment {
  id: number;
  courseid: number;
  userid: number;
  roleid: number;
  timestart: number; // Timestamp
  timeend: number; // Timestamp
  status: boolean;
}
export interface ForumPostsResponse {
  posts: ForumPost[];
  forumid: number;
  courseid: number;
  warnings: any[];
}

export interface ForumPost {
  id: number;
  subject: string;
  replysubject: string;
  message: string;
  messageformat: number;
  author: {
    id: number;
    fullname: string;
    isdeleted: boolean;
    groups: any[];
    urls: {
      profile: string;
      profileimage: string;
    };
  };
  discussionid: number;
  hasparent: boolean;
  parentid: number | null;
  timecreated: number;
  timemodified: number;
  unread: boolean | null;
  isdeleted: boolean;
  isprivatereply: boolean;
  haswordcount: boolean;
  wordcount: number | null;
  charcount: number | null;
}

export interface Attachment {
  filename: string;
  filepath: string;
  filesize: number;
  fileurl: string;
  timemodified: number;
  mimetype: string;
}

export interface EnrolledUser {
  id: number;
  fullname: string;
  roles: {
    roleid: number;
    name: string;
    shortname: string;
  }[];
}

export interface CourseSection {
  id: number;
  name: string;
  summary: string;
  summaryformat: number;
  modules: CourseModule[];
}

export interface CourseModule {
  id: number;
  name: string;
  modname: string;
  modplural: string;
  modicon: string;
  url: string;
  instance: number;
}
