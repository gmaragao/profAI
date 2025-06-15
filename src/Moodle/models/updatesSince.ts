export interface MoodleUpdateResponse {
  instances: MoodleUpdateInstance[];
  warnings: MoodleWarning[];
}

export interface MoodleUpdateInstance {
  contextlevel: "module" | string; // typically "module"
  id: number; // the cmid (course module ID)
  updates: MoodleModuleUpdate[];
}

export interface MoodleModuleUpdate {
  name: string; // e.g. "discussions", "contentfiles", etc.
  timeupdated: number; // Unix timestamp of the update
  itemids?: number[]; // IDs of the updated items (e.g., discussionid, postid)
}

export interface MoodleWarning {
  item: string; // e.g., "course"
  itemid: number; // ID of the item that triggered the warning
  warningcode: string; // Moodle warning code
  message: string; // Human-readable warning message
}

export interface DetailedUpdates {
  id: number; // The ID of the item (example: post id)
  subject: string; // The subject of the item (example: post subject)
  content: string; // The content of the item (example: post content)
  authorFullName: string; // The author of the item (example: post author)
  authorId: number; // The ID of the author (example: post author ID)
  timeCreated: number; // The time the item was created (example: post creation time)
  timeModified?: number; // The time the item was last updated (example: post update time)
  moduleId: number; // The ID of the module  (example: discussion ID, quiz ID, etc.)
  typeName: string; // The type of the module (example: "forum", "quiz", etc.)
  createdAt: string;
  updatedAt?: string;
}
