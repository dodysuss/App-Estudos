export type CourseFormValues = {
  name: string;
  description: string;
  url: string;
  totalLessons: string;
  kind: "COURSE" | "VIDEO_PLAYLIST";
  folderId: string;
  subject: string;
  tags: string;
};

export function readCourseFormValues(formData: FormData): CourseFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
    totalLessons: String(formData.get("totalLessons") ?? ""),
    kind: formData.get("kind") === "VIDEO_PLAYLIST" ? "VIDEO_PLAYLIST" : "COURSE",
    folderId: String(formData.get("folderId") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    tags: String(formData.get("tags") ?? ""),
  };
}
