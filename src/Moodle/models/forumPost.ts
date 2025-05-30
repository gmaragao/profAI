export interface MoodleForumPostResponse {
  post: MoodleForumPost;
  warnings?: MoodleWarning[];
}

export interface MoodleForumPost {
  id: number;
  subject: string;
  replysubject: string;
  message: string;
  messageformat: number;
  author?: {
    id?: number;
    fullname?: string;
    isdeleted?: number;
    groups?: {
      id: number;
      name: string;
      urls: {
        image?: string;
      };
    }[];
    urls?: {
      profile?: string;
      profileimage?: string;
    };
  };
  discussionid: number;
  hasparent: number;
  parentid?: number;
  timecreated: number;
  timemodified: number;
  unread?: number;
  isdeleted: number;
  isprivatereply: number;
  haswordcount: number;
  wordcount?: number;
  charcount?: number;
  capabilities: {
    view: number;
    edit: number;
    delete: number;
    split: number;
    reply: number;
    selfenrol: number;
    export: number;
    controlreadstatus: number;
    canreplyprivately: number;
  };
  urls: {
    view?: string;
    viewisolated?: string;
    viewparent?: string;
    edit?: string;
    delete?: string;
    split?: string;
    reply?: string;
    export?: string;
    markasread?: string;
    markasunread?: string;
    discuss?: string;
  };
  attachments?: MoodleForumAttachment[];
  messageinlinefiles?: MoodleForumAttachment[];
  tags?: MoodleTag[];
  html: {
    rating?: string;
    taglist?: string;
    authorsubheading?: string;
  };
}

export interface MoodleForumAttachment {
  contextid: number;
  component: string;
  filearea: string;
  itemid: number;
  filepath: string;
  filename: string;
  isdir: number;
  isimage: number;
  timemodified: number;
  timecreated: number;
  filesize: number;
  author: string;
  license: string;
  filenameshort: string;
  filesizeformatted: string;
  icon: string;
  timecreatedformatted: string;
  timemodifiedformatted: string;
  url: string;
  urls?: {
    export?: string;
  };
  html?: {
    plagiarism?: string;
  };
}

export interface MoodleTag {
  id: number;
  tagid: number;
  isstandard: number;
  displayname: string;
  flag: number;
  urls: {
    view: string;
  };
}

export interface MoodleWarning {
  item?: string;
  itemid?: number;
  warningcode: string;
  message: string;
}
